# Pipecraft State Review — 2026-06-18

**Branch:** docs/state-review-roadmap
**Scope:** Review the last ~3 days of updates and the docs site; check docs accuracy,
drift from original intent, architecture soundness (adversarial), and produce a roadmap.

> Companion docs: `docs/analysis/2026-06-18-architecture-review.md` (adversarial review),
> `ROADMAP.md` (todos + what's next).

---

## 1. Original Intent

Grounded in `README.md`, `package.json`, `docs/docs/intro.md`, and `docs/docs/architecture.md`.

**What pipecraft is:** an automated CI/CD pipeline **generator** for **trunk-based
development**. It generates GitHub Actions workflows into a user's repo with best
practices built in — then gets out of the way (the generated files are the user's).

**Core principles (the intent to hold to):**

1. **Generator, not a runtime/framework** — output is plain, owned, editable YAML; no
   lock-in. "Fully customizable, completely yours."
2. **Trunk-based, linear history** — `mergeStrategy: fast-forward`; branch flow
   `initial → … → final` (e.g. develop → staging → main); promotion via PRs.
3. **Domain-based change detection** — only affected domains run (via `dorny/paths-filter`);
   language-agnostic (no NX-specific coupling — NX support was deliberately removed).
4. **Conventional-commit semantic versioning** — version computed from commits
   (release-it), tag on initial branch, release gated to final branch.
5. **Customization survives regeneration** — user-authored ("custom") jobs and edits are
   preserved across `pipecraft generate` via AST path operations + markers.
6. **Composable actions** — 7 core actions (changes, calculate-version, create-tag,
   promote-branch, create-release, manage-branch, create-pr) referenced in `local`,
   `remote`, or `source` mode; intended for GitHub Marketplace publication.

**Non-goals (from intent):** not a deploy tool, not language-specific, not a DI-heavy
framework, no manual versioning/tagging.

---

## 2. Recent Updates Inventory (last ~3 days, 16 PRs merged to develop)

Grouped by area, with net effect. (first-parent `git log origin/develop --since=3.days`)

### Versioning & release robustness

- **#333** custom-jobs preservation w/ marker-mismatch detection — core "edits survive regen" guarantee hardened.
- **#335** version job warns on empty version on the final branch — the silent release-skip is now visible.
- **#336** `calculate-version` nearest-reachable-tag fallback (`git describe`) — a merge-commit promotion still cuts a release; + promotion docs.
- **#337** `doctor`/`setup-github` detect the org-level "Actions can't create PRs" lock and print actionable guidance (was a raw 409).

### promote-branch (largest thread)

- **#351** promote does **fast-forward, not rebase**; repaired the never-passing `test-promote-branch.yml` (6 layered bugs).
- **#409** reconciled the two divergent promote-branch copies onto one template, unified config key on **`autoPromote`**, fixed an empty-`prNumber`-on-reuse bug, added "Configure Git", fixed the `sync-actions` README-wipe bug, cleared v4→v5 drift, corrected docs.
- **#427** new **`runtime` config** (`nodeVersion`/`pnpmVersion`) → drives workflow env versions from config; retired the pnpm pin as a hand-edit.

### CI infrastructure

- **#334** `checkout`/`setup-node` v4→v5 (Node-24).
- **#338** fixed broken `sync-actions` tooling + added a drift gate workflow.
- **#348 → #394** chased a hidden CI break: pnpm `latest` became pnpm 11, which dropped `package.json` build-script approval → `ERR_PNPM_IGNORED_BUILDS`; pinned to 10.6.2.
- **#430 / #433** regenerated the typedoc API reference (it had drifted badly) and made typedoc generation **deterministic** (pin source links to `main`, prettier the output).

### Marketplace prep

- **#206 / #207 / #217** create-tag / promote-branch / calculate-version readied for marketplace (branding, READMEs, action tests).

### Triage (closed, not merged)

- **#235** superseded; **#266/#267/#270/#276** stale/vapor copilot PRs closed with reasons; **#347** (an erroneous "delete vestigial .github/actions" — they're marketplace targets; caught by conflict) closed.

**Net:** the promote → version → release → CI path and its docs are materially more robust
and internally consistent (one canonical action template, `autoPromote` everywhere,
config-driven tool versions, deterministic API docs). No production deploys; develop green.

---

## 3. Docs Audit (item 2)

Method: docusaurus `build` (broken-anchor/link check) + targeted greps for removed/renamed features.

| Finding                                                                                                                                                                                                                                                                                                       | Severity   | Status                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **NX docs document a removed feature** — `nx` config block, Nx auto-detection, `nx affected`, `detect-changes-nx` action, an "Nx-based detection mode". NX is gone from the code (no `nx` in `src/types`, no nx templates, no config handling). Users following these docs would set a key pipecraft ignores. | High       | **Fixed** — corrected `configuration-reference.md`, `intro.md`, `faq.md` to the accurate language/tool-agnostic stance (Nx repos supported via domain path globs; no special integration). |
| **Broken anchors in `ast-operations.md`** — the TOC linked `#features` etc., but emoji headings slugify differently; build reported 6 broken anchors.                                                                                                                                                         | Medium     | **Fixed** — added explicit `{#…}` anchor IDs to the 6 headings.                                                                                                                            |
| `autoMerge` phantom config key in docs                                                                                                                                                                                                                                                                        | (was High) | **Already fixed** earlier (#409/#430); re-verified 0 occurrences.                                                                                                                          |
| Docusaurus `onBrokenMarkdownLinks` config deprecated (v4 migration) — build warns.                                                                                                                                                                                                                            | Low        | **Deferred** → roadmap (docs tooling upkeep).                                                                                                                                              |
| `version-management.md` `mergeMethod` example shows per-branch `squash`/`merge` — `mergeMethod` is a real config field, but whether the promote action honors it (it fast-forwards) is unverified.                                                                                                            | Low        | **Deferred** → roadmap (verify wiring or mark advisory).                                                                                                                                   |

**Build status:** docusaurus `build` exits 0 (no broken anchors/links) after fixes.
