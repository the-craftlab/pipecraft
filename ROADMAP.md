# Pipecraft Roadmap

_Last updated: 2026-06-18. Sourced from
[state review](docs/analysis/2026-06-18-state-review.md) and
[architecture review](docs/analysis/2026-06-18-architecture-review.md)._

---

## P0 — Fix now (high-severity, user-trust issues)

### P0-1 · Fire-and-forget workflow dispatch

**What:** `promote-branch` dispatches the next pipeline with `gh workflow run` and
returns success immediately, with no check that the triggered run actually started.

**Why:** A user watching the pipeline sees "promote: ✓ passed" and reasonably assumes
the target branch is running — but the dispatch may have silently dropped (misconfigured
branch, transient API error, rate limit). The failure is invisible.

**Fix:** After dispatch, poll `gh run list --workflow=pipeline.yml --branch=<target>`
for up to ~30 s and assert the triggered run appears. Emit a distinct warning + non-zero
exit if it doesn't. This is a minimal, non-architectural change.

**Source:** Architecture review P2-A; `promote-branch.yml.tpl.ts` line ~315.

---

### P0-2 · Marketplace publication

**What:** Actions (`create-tag`, `promote-branch`, `calculate-version`) have been
readied for the GitHub Marketplace (branding, READMEs, action tests — PRs #206/#207/#217)
but have not been published.

**Why:** This is a stated design goal ("composable actions intended for Marketplace
publication"). Until published, `remote` action mode is a documentation fiction — users
cannot actually reference `the-craftlab/pipecraft/actions/[name]@v1`.

**Fix:** Publish the three readied actions to the GitHub Marketplace. Gate publication
behind action test CI (already in place). Add Marketplace badge links to CLI output
and docs.

**Source:** State review §4 ("composable actions / marketplace: in progress").

---

## P1 — Next sprint (important, no active workaround)

### P1-1 · Thread version through promotion (B2 durable fix)

**What:** `promote-branch` currently relies on the target branch re-running
`calculate-version` from scratch after merge. When the promotion is a merge commit
(not fast-forward), version resolution on the target branch can miss the tag, falling
back to `git describe`. This is the root cause of the "no release was cut" class of
issues.

**Why:** B1 (`git describe` fallback, PR #336) is a guard, not the fix. The durable
solution is to calculate the version on the initial branch, then explicitly pass it
as an input to the next pipeline dispatch — eliminating the need for re-derivation
entirely.

**Fix:** Add a `version` input to the `workflow_dispatch` trigger on `pipeline.yml`.
The `promote-branch` action reads the already-calculated version from the current run
and passes `--field version=<ver>` to `gh workflow run`. Downstream `calculate-version`
prefers the provided input over its own derivation.

**Source:** State review §4 drift table ("B2 deferred"); troubleshooting docs.

---

### P1-2 · Document promotion rollback

**What:** When a deploy job fails after a promotion PR merges, there is no
Pipecraft-managed recovery path. Users must manually revert or force-push.

**Why:** No change is needed in the generator — rollback is inherently
environment-specific. But the silence in the docs creates a trust gap: users expect
that a production-grade pipeline tool has a rollback story.

**Fix:** Add a "Recovering from a failed promotion" section to the troubleshooting
docs: explain that the tagged commit is on the target branch, that the recommended
path is a `git revert` commit + re-promote, and that force-push breaks linear history
and should be avoided.

**Source:** Architecture review P3-B.

---

### P1-3 · Comment-safe fallback preservation

**What:** When the `<--START CUSTOM JOBS-->` / `<--END CUSTOM JOBS-->` markers are
absent or malformed, the fallback preserves custom jobs by re-serializing through
the YAML AST. This silently drops inline YAML comments.

**Why:** A user who writes `# TODO: replace with helm chart once cluster is ready`
above a placeholder step loses that comment on the next regeneration that hits the
fallback. The loss is permanent and silent.

**Fix:** In the fallback path, capture the raw YAML string for each detected custom
job (from the prior file text, not the re-serialized AST) and splice it in verbatim.
Alternatively, emit a warning when the fallback path is taken so users know to
re-add markers.

**Source:** Architecture review P1-A; `pipeline.yml.tpl.ts` fallback at ~lines 340–380.

---

### P1-4 · Consolidate `managedJobs` into a single source

**What:** The list of managed job names (`changes`, `version`, `gate`, `tag`,
`promote`, `release`) is declared independently in `src/utils/config.ts`
(`RESERVED_JOB_NAMES`) and in `pipeline.yml.tpl.ts` (`managedJobs`).

**Why:** Adding a new managed job requires touching both files. Nothing enforces
consistency.

**Fix:** Import `RESERVED_JOB_NAMES` from `config.ts` into the pipeline template
and derive `managedJobs` from it. One source of truth; sync is automatic.

**Source:** Architecture review P1-B.

---

### P1-5 · Verify / fix `mergeMethod` wiring

**What:** `version-management.md` shows per-branch `mergeMethod: squash` /
`mergeMethod: merge` config examples. `mergeMethod` is a real config field, but
`promote-branch` always fast-forwards — it is unclear whether the config field
actually influences the promotion merge behavior.

**Why:** If the config key is read but ignored, users who set `mergeMethod: squash`
on a branch are configuring something that has no effect.

**Fix:** Trace `mergeMethod` from config parsing through template generation to the
actual `gh pr merge` call in `promote-branch`. If it is wired: verify docs match
behavior. If it is not wired: document it as advisory / remove the field from docs
until it is implemented.

**Source:** State review §3 docs audit (deferred item).

---

## P2 — Backlog (valuable, but no urgent pressure)

### P2-1 · GitLab CI support

**What:** The `ciProvider` config field accepts `'github'` and `'gitlab'`, but GitLab
CI generation is not implemented.

**Why:** Stated in the original intent; a significant fraction of potential users are
on GitLab.

**Source:** Original intent §1; `faq.md` ("GitLab CI/CD: planned for future").

---

### P2-2 · Additional branch flow patterns

**What:** GitHub Flow (feature branches → main) and GitFlow (develop → release → main
with hotfixes) are listed as "planned" in the FAQ.

**Why:** Trunk-based development is the primary pattern but not universal.

**Source:** `faq.md` §"What branch flows are supported?".

---

### P2-3 · Workflow sharding for large monorepos

**What:** All jobs for all domains are emitted into a single `pipeline.yml`. At 20+
domains this becomes unwieldy; at 255 jobs it hits GitHub's documented per-run limit.

**Why:** Not a current-user problem. Planning for it now shapes template architecture
(per-domain reusable workflow files, an orchestrator workflow) before the single-file
assumption is too deeply embedded.

**Source:** Architecture review P3-A.

---

### P2-4 · `doctor` validates gate `needs` completeness

**What:** When a domain is added after initial setup, its test job is not automatically
added to `gate.needs`. `doctor` does not detect this gap.

**Why:** A gate that passes without running all domain tests is worse than no gate —
it gives false confidence.

**Fix:** Add a `doctor` check: parse the generated workflow, compare `gate.needs`
against all domain test job names, and warn on any missing entries.

**Source:** Architecture review P3-C.

---

### P2-5 · Docusaurus v4 migration (`onBrokenMarkdownLinks`)

**What:** Docusaurus build warns about the deprecated `onBrokenMarkdownLinks` config
key (renamed in v4 migration).

**Why:** Low urgency — build exits 0 and the warning doesn't affect the site — but
accumulated warnings create noise and may become errors in a future Docusaurus
version.

**Source:** State review §3 docs audit (deferred item).

---

### P2-6 · pnpm 11 approval (unblock the pin)

**What:** pnpm is pinned at 10.6.2 via the `runtime` config because pnpm 11 dropped
the `package.json` build-script approval mechanism, causing `ERR_PNPM_IGNORED_BUILDS`
in CI.

**Why:** The pin is declared (not hidden) but it's a deviation from "use latest."
Revisit when pnpm 11's approval story stabilizes.

**Source:** State review §4 drift table ("tooling pragmatism").

---

## Known Gaps

These are areas where the current implementation is intentionally incomplete or where
documentation coverage is insufficient. They are not bugs.

| Gap                                       | Impact                                 | Status |
| ----------------------------------------- | -------------------------------------- | ------ |
| Marketplace actions not published         | `remote` action mode is non-functional | P0-2   |
| No promotion rollback path                | Users stranded after failed deploy     | P1-2   |
| `mergeMethod` config wiring unverified    | Docs may describe a no-op              | P1-5   |
| GitLab CI not implemented                 | GitHub-only                            | P2-1   |
| Gate needs not auto-updated on domain add | Silent test gap on domain expansion    | P2-4   |
| No workflow sharding                      | Scale ceiling ~255 jobs                | P2-3   |
| B2 (threaded version) deferred            | `git describe` fallback is the guard   | P1-1   |

---

## What's Next (sequenced)

1. **P0-1** (fire-and-forget dispatch) — self-contained change to `promote-branch`;
   no template API changes; highest trust-repair value per effort.
2. **P0-2** (marketplace publication) — unblocks `remote` mode and the composable
   action story; dependency: CI for action tests must stay green.
3. **P1-1** (B2 threaded version) — requires `workflow_dispatch` input + `calculate-version`
   input-prefer logic; do after marketplace so the updated action versions can be
   tagged together.
4. **P1-2** (rollback docs) — purely additive; can be done in parallel with any of
   the above.
5. **P1-3 + P1-4** (comment-safe fallback + managedJobs consolidation) — low-risk
   code quality; bundle into a single PR.
6. **P1-5** (`mergeMethod` audit) — clarify before adding more branch-config docs.
7. **P2-1** (GitLab CI) — significant work; gate behind a milestone.
