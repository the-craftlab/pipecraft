# Pipecraft Architecture Review (Adversarial) — 2026-06-18

**Branch:** docs/state-review-roadmap
**Method:** 4 parallel adversarial review passes (distinct lenses, each blind to the others),
then a verification pass that reproduced the high-severity findings against the code and the
built CLI. Companion: `2026-06-18-state-review.md`, `ROADMAP.md`.

**Bottom line:** The _design intent_ is sound and on-track (a generator that emits owned YAML
for trunk-based flows with domain change detection, conventional-commit versioning, and
preserve-on-regenerate). But the _implementation_ does **not** currently withstand adversarial
review: there are **6 verified High-severity gaps** where the system silently does the wrong
thing (drift it can't heal, gates that don't gate, config it ignores, releases it can miss).
None are fundamental; all are fixable and are carried into `ROADMAP.md`.

---

## Pass 1 — Version / Promote / Release

- **[High, verified] Release identity rests on tag-reachability heuristics.** On the manual-merge
  promotion path (`autoPromote=false`, the _recommended_ prod path `main: false`), the target
  branch gets a plain `push` with no threaded version; the release is reconstructed via
  `git describe --tags --abbrev=0` (`actions/calculate-version/action.yml:137`). A merge-commit
  promotion leaves the tag off-HEAD, and `describe` returns the nearest tag by topology — which
  can be the **wrong** version. B1 narrows the "missing release" case but introduces a "wrong
  release" case. **→ B2 (thread the version through promotion, e.g. parse the
  `release/{src}-to-{tgt}-{version}` branch) is genuinely required, not optional.**
- **[High, verified] No `concurrency:` guard** is generated. Two rapid merges / a re-run produce
  racing version→tag→promote sequences with TOCTOU on the temp-branch and PR-existence checks, and
  racing `--ff-only` pushes that half-promote.
- **[Med] `create-release` is not idempotent**: re-running a released version fails the job,
  contradicting the docs' "re-running is safe" claim.
- **[Med] release-it failure == "no version"** (`... || echo ""`): a transient release-it failure
  is indistinguishable from "no bump" → release silently skipped on a green pipeline.

**Verdict:** Not sound for the manual/merge-commit promotion path; B2 + a concurrency guard needed.

## Pass 2 — Template generation / customization-preservation / action modes

- **[High, verified] The "managed sections are re-enforced" guarantee is FALSE in default mode.**
  Reproduced: tamper a managed job's `runs-on`, run `pipecraft generate` (no `--force`) → the
  tampered value **survives**; only `--force` heals it. The header comment promises Pipecraft
  manages those sections — it doesn't, by default. (All existing preservation tests use
  `force:true`, so this path is untested.)
- **[High, verified] Default `local` action set has drifted to stale, removed Nx code.**
  `.github/actions/detect-changes/action.yml` contains **59** Nx/`affected` references and takes
  `domains-config` as JSON, while the current template emits YAML. `local` is the **default**
  `actionSourceMode`, so the average user references the stale action — a different contract than
  `source` mode. (#409 only fixed promote-branch.)
- **[High] Custom job whose name collides with a managed job (`release`/`tag`/`gate`/…) emits
  duplicate keys → unparseable workflow** and `generate` exits 1 after partially writing files.
  Reserved-name validation guards domain names only, not custom job names.
- **[Med] The marker-fallback path drops user YAML comments.** When the custom-jobs markers are
  absent/malformed, the fallback parses YAML to an AST and re-stringifies, discarding inline
  comments in user jobs — silent data loss on an edge path.
- **[Med] `sync-actions` gate covers only `actions/`** (source mode) — `.github/actions/` and
  `examples/**` drift unguarded (exactly how the stale-Nx action went unnoticed).
- **[Low] `name`/`permissions`/`env` use `preserve`** — security-relevant `permissions` are never
  re-enforced once wrong.

**Verdict:** Sound on the happy path (clean markers, `--force`); not sound as shipped — the
preserve guarantee fails in default mode and the default action set has already drifted.

## Pass 3 — Self-CI / tooling / supply chain

- **[High, verified] Required checks are path-filtered → "skipped == passed" lets broken changes
  merge green.** `test-cicd`/`test-core`/`test-docs` only run when their domain paths change; a
  skipped required check is treated as satisfied. A PR that breaks logic outside a check's domain
  merges green.
- **[High, verified] The `gate` job is inert on PRs and isn't the required check.** `gate`
  (`pipeline.yml:399`) requires `needs.version.result == 'success'`, but `version` has
  `if: github.event_name != 'pull_request'` → skipped on PRs → gate never runs on PRs. The one job
  implementing the correct aggregate-gate pattern gives zero PR protection, and branch protection
  points at the path-filtered jobs instead of it.
- **[High] `test-cicd` runs only `validate-pipeline.cjs`** — not `pnpm test`, `lint`, or
  `sync-actions:check`. The "cicd" gate has near-zero real coverage.
- **[Med] Unpinned third-party action tags everywhere** (`codecov`, `dorny/paths-filter`,
  `marocchino`, `amannn`, `pnpm/action-setup`, mixed `checkout@v4`/`@v5`) — the floating-tag class
  that already bit us (pnpm `latest`→11); worst on the `publish.yml` OIDC path.
- **[Med] `detect-changes` maps filter→domain via substring `grep`** — overlapping domain names
  (`core`/`core-api`) mis-detect, feeding the skip-as-pass hole.
- **[Med, verified] Generator default `pnpmVersion` is `'10'` (major) and `package.json` lacks
  `packageManager`** — a fresh project pins a major, not the verified patch; safer than `latest`
  but should be exact, and local dev pnpm is unpinned vs CI.

**Verdict:** Not currently a trustworthy merge gate — multiple independent paths merge broken green.

## Pass 4 — Config schema / validation / DX

- **[High, verified] `validateConfig` never rejects unknown/misspelled keys** (`src/utils/config.ts`,
  no `additionalProperties`/key enumeration) — the structural root cause of the `autoMerge`/`nx`
  doc bugs: a wrong key is silently dropped and `pipecraft validate` says OK.
- **[High, verified] `mergeMethod` (and `mergeStrategy: 'merge'`) are documented-but-dead** —
  declared in types + `.pipecraft-schema.json` + 6 doc files, consumed in zero templates; the
  promote action hardcodes `--ff-only`. Users setting them get no effect and no warning.
- **[High, verified] `.pipecraft-schema.json` is out of sync with `src/types` both ways** —
  `runtime` is missing from the schema (valid config gets editor squiggles); `mergeMethod`/
  `mergeStrategy:'merge'` are in the schema but unimplemented. No schema↔types test.
- **[Med] No value validation** for `runtime.{node,pnpm}Version`, `autoPromote` shape (string/array
  slip through), `semver` (schema-required but validator-optional), `branchFlow` duplicates;
  preflight uses a weaker required-field list than `validateConfig` (the two disagree on validity).

**Verdict:** Validation is a hand-rolled allowlist that silently ignores unknown keys; the JSON
schema isn't the enforced source of truth — adopt schema + `ajv` (`additionalProperties:false`)
plus a schema↔types consistency test.

---

## Verified findings (reproduced this session)

| #   | Finding                                                    | How verified                                                                                          |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| A   | Non-`--force` regen does NOT heal a tampered managed job   | generated → tampered `changes.runs-on` → regen (no force) kept `TAMPERED-RUNNER`; `--force` healed it |
| B   | `.github/actions/detect-changes` still contains removed Nx | grep: 59 Nx/affected refs                                                                             |
| C   | `validateConfig` ignores unknown keys                      | read `config.ts` — allowlist only, no `additionalProperties`                                          |
| D   | `mergeMethod` consumed nowhere                             | grep across `src/templates` + `actions` — 0 hits                                                      |
| E   | `runtime` missing from `.pipecraft-schema.json`            | grep — 0 hits                                                                                         |
| F   | `gate` inert on PRs                                        | `gate` needs `version==success`; `version` is `if != pull_request` → skipped on PRs                   |

## Overall verdict

The architecture's **intent and shape are sound and have not drifted**, but it does **not yet
stand up to adversarial review at the implementation level**. Six verified High-severity gaps
share one theme: **the system silently tolerates the wrong state** — unhealed managed drift,
skipped-but-required gates, ignored config keys, schema↔code divergence, and missing/wrong
releases. Each is fixable; together they define the near-term hardening roadmap. Highest-leverage
fixes: (1) make the merge gate real (require an always-running aggregate; run the actual suite),
(2) enforce the config schema (reject unknown keys), (3) make managed-section enforcement work
without `--force` (or document it honestly), (4) cover `.github/actions`/examples in the drift
gate, (5) thread the version through promotion (B2).
