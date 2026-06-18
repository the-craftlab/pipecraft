# Pipecraft Adversarial Architecture Review — 2026-06-18

**Branch:** docs/state-review-roadmap
**Scope:** Three iterative adversarial passes over the core architecture, grounded in
source code. Each pass targets a different attack surface, compounds on findings from
the prior pass, and assigns severity. A "Verified findings" section follows with
confirmed issues only. Verdict at the end.

---

## Pass 1: Custom-Job Preservation

**Target:** The "customizations survive regeneration" guarantee — the most user-facing
invariant in the system. If this breaks, users lose work silently.

**Attack surface reviewed:**
`src/templates/workflows/pipeline.yml.tpl.ts` (marker extraction, fallback path)

### Findings

**P1-A: Fallback path loses YAML comments (High)**

The primary preservation path extracts the user-authored section verbatim via a
regex match on the `<--START CUSTOM JOBS-->` / `<--END CUSTOM JOBS-->` markers. If
those markers are absent or malformed, the fallback extracts custom jobs by parsing
the existing YAML into a doc object (`tempDoc`), filtering out managed jobs, then
calling `tempDoc.toString()`. YAML stringify through the `yaml` library reconstructs
from the AST — which discards inline comments.

A user who writes:

```yaml
deploy-staging:
  # TODO: replace with helm chart deployment once cluster is provisioned
  runs-on: ubuntu-latest
  steps:
    - run: echo "placeholder"
```

will silently lose the `# TODO` comment on any regeneration that triggers the
fallback path. The primary path (marker-based) preserves the raw string, so this
only bites users who modified the file without understanding the markers, or whose
markers got corrupted.

**P1-B: `managedJobs` duplicated in two places (Low)**

`src/utils/config.ts:RESERVED_JOB_NAMES` and the `managedJobs` set in
`pipeline.yml.tpl.ts` are two independent declarations of the same 6 names.
Adding a new managed job (e.g., a future `notify` job) requires touching both files,
and nothing enforces this. The risk today is low because the set is stable, but it is
a latent maintenance trap.

**P1-C: Gate `needs` can go stale across major template changes (Medium)**

`operations-gate.ts` preserves `gateNeeds` from the existing file when the gate job
already existed. This is correct behavior — it prevents clobbering user-added test
jobs from the gate. However, if a future Pipecraft version changes the gate's
baseline `needs` (e.g., adding a new structural job that must always precede the
gate), regeneration on an existing project will silently retain the old `needs`. The
user would have to regenerate with `--force` and manually re-add their test jobs.
There is no migration path; the gap is hidden.

---

## Pass 2: Version Resolution and Promotion Dispatch

**Target:** The version → tag → promote → release chain. Correctness here is
non-negotiable: a silent version miss produces an untagged commit in production.

**Attack surface reviewed:**
`src/templates/actions/calculate-version.yml.tpl.ts`,
`src/templates/actions/promote-branch.yml.tpl.ts`

### Findings

**P2-A: `gh workflow run` is fire-and-forget (High)**

`promote-branch` dispatches the next pipeline via:

```bash
gh workflow run pipeline.yml "${WORKFLOW_ARGS[@]}"
```

There is no `--wait`, no polling, no verification that the dispatch succeeded or that
the triggered run started. `gh workflow run` returns exit 0 as long as the API call
accepted the dispatch event — not as long as the workflow actually started. If the
target branch has no workflow file (misconfiguration), or if the repository's
`workflow_dispatch` trigger is temporarily rate-limited, the dispatch silently
disappears. The promote job shows green; the next branch never runs.

A user watching the pipeline from the promotion branch sees "promote: ✓ passed" and
reasonably assumes the target branch is running — but it may not be.

**P2-B: `git describe` fallback is ambiguous on divergent histories (Medium)**

`calculate-version` falls back to `git describe --tags --abbrev=0 --match 'v[0-9]*'`
when no version resolves from conventional commits on the initial branch. This
returns the nearest reachable ancestor tag. In a standard Pipecraft trunk flow
(linear history, fast-forward only), this is safe. But:

1. If a hotfix branch is cut from `main`, tagged, and later the `develop` line
   continues from an older commit, `git describe` on `develop`'s HEAD could return
   the hotfix tag — a tag that is _not_ an ancestor of the current HEAD in the develop
   line but is reachable via the merge graph.
2. The `--abbrev=0` flag suppresses the `N-commits-ahead` suffix, so there is no
   signal that the tag is not the immediately preceding version.

In practice this is benign for projects that use only the standard two- or three-branch
flow with no hotfixes. For projects with out-of-band tagging or parallel-branch
models, the fallback could resolve to a misleading version anchor.

---

## Pass 3: Structural Scale and Failure Recovery

**Target:** What happens as projects grow larger or failures occur mid-pipeline.

**Attack surface reviewed:** Generated `pipeline.yml` structure, branch protection
model, lack of rollback primitives.

### Findings

**P3-A: Single-workflow file doesn't scale to many domains (Medium)**

All jobs for all domains are emitted into a single `pipeline.yml`. At ~5 domains this
is manageable; at 20+ domains the file exceeds 1,000 lines and the GitHub Actions
UI's "Jobs" panel becomes a wall. GitHub also has a documented limit of 255 jobs per
workflow run, which a large monorepo with many domains, many branches, and matrix
expansion could approach.

Pipecraft's architecture assumes a single workflow file. A future "workflow sharding"
feature would require structural changes to how domains, gates, and versioning
interconnect.

**P3-B: No rollback mechanism for a failed promotion (High — known gap)**

When a promotion PR is created and the auto-merge completes, the tagged commit is now
on the next branch. If a deploy job on that branch subsequently fails, there is no
Pipecraft-managed path to roll back. The user must:

1. Manually revert the promotion PR or force-push (breaking linear history)
2. Push a fix commit to the prior branch, re-run the pipeline, and re-promote

This is architecturally correct for the "you own the output" philosophy — rollback
is inherently environment-specific. But the docs do not mention this, which sets
users up for confusion during their first failed production deploy. No change needed
in the generator; documentation coverage is the gap.

**P3-C: Gate `needs` not auto-updated when domains are added (Low)**

The gate job guards the version → tag → promote chain. When a user adds a domain
after initial setup, the new domain's test job is **not** automatically added to
`gate.needs`. The user must manually add it, or the gate passes even if the new
domain's tests never ran. The generator intentionally does not auto-update gate needs
(to avoid clobbering user edits), but there is no diagnostic to flag the mismatch.
`pipecraft doctor` does not check this.

**P3-D: Prefix jobs use a separate code path (Low)**

Domain jobs whose names have a `jobPrefix` set are generated through a slightly
different branch in the template. This means rename detection (e.g., detecting that a
domain was renamed from `api` to `backend-api`) would need to account for both paths.
Currently there is no rename detection at all — a renamed domain generates a new job
and orphans the old one — so this is a latent complexity rather than an active bug.

---

## Verified Findings

The following findings were confirmed against source code; they are real issues, not
theoretical:

| ID   | Finding                                                | Severity         | Source evidence                                                                |
| ---- | ------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------ |
| P1-A | Fallback path loses YAML comments                      | High             | `pipeline.yml.tpl.ts` lines ~340-380: `tempDoc.toString()` reassembly from AST |
| P1-B | `managedJobs` declared in two places                   | Low              | `config.ts:RESERVED_JOB_NAMES` vs `pipeline.yml.tpl.ts:managedJobs`            |
| P1-C | Gate `needs` stale across template evolution           | Medium           | `operations-gate.ts` lines 144-148: update only skipped when gate existed      |
| P2-A | Fire-and-forget workflow dispatch                      | High             | `promote-branch.yml.tpl.ts` line 315: no `--wait`/status check                 |
| P2-B | `git describe` ancestor ambiguity on divergent history | Medium           | `calculate-version.yml.tpl.ts` lines 181-214                                   |
| P3-A | Single-workflow scale ceiling                          | Medium           | Structural — no per-domain workflow splitting                                  |
| P3-B | No promotion rollback primitive                        | High (known gap) | Design gap; no rollback in templates or docs                                   |
| P3-C | Gate needs not auto-updated on domain add              | Low              | `operations-gate.ts` design; `doctor` doesn't flag gap                         |
| P3-D | Prefix-job code path divergence                        | Low              | `pipeline.yml.tpl.ts` prefix branch                                            |

**Findings that did not survive verification:**

- _"Markers could be matched by user content"_ — regex requires markers on their own
  lines with exact casing; realistic user YAML will not collide.
- _"`git describe` uses wrong glob"_ — `--match 'v[0-9]*'` is correct; matches all
  vX.Y.Z tags, not unversioned tags.
- _"Gate is always skipped when no test jobs exist"_ — gate has no `if:` condition
  gating on domain test output; it runs unconditionally; the risk is that it passes
  without being meaningful, not that it is skipped.

---

## Verdict

**The architecture holds for its stated scope (2–10 domain trunk-based projects on
GitHub Actions).** The core invariants — generated YAML is owned and editable,
customizations survive regeneration, fast-forward linear history, conventional-commit
semver — are structurally sound and have been materially hardened in the last sprint.

**Two findings warrant roadmap entries (not blockers):**

1. **P2-A (fire-and-forget dispatch)** is the highest-risk gap in the promotion
   chain. A job that reports success while the downstream run silently never started
   is a user-trust problem. A minimal fix (poll `gh run list` for the triggered run
   and assert it started) would close this without changing the architecture.

2. **P3-B (no rollback primitive)** is a known gap but needs explicit documentation
   so users understand the expected recovery path before they need it.

**Three findings warrant minor code-quality attention:**
P1-A (comment loss in fallback), P1-B (duplicated managed-jobs declaration), P3-C
(gate needs not validated by `doctor`). None of these break the architecture.

**No findings indicate structural drift from the original intent.** The generator
remains a tool that produces owned, editable YAML — not a runtime or framework.
