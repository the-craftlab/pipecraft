# GitLab Flow support

Not on the 2026-09-04 ten-goals ranking; surfaced 2026-09-11 while drafting
`docs/tmp/vision-draft.md`'s flow-topology pillar. Decision: **defer**. James, 2026-09-11:
defer means committed, ranked below the build items; drop only if an attempt shows it can't
be built reliably or easily.

## What exists

Nothing. `rg -i "gitlab flow"` across `*.md` and `*.ts` in this repo returns zero hits,
confirmed 2026-09-11. No reqts file, roadmap line, or code path names it before this one.

## What GitLab Flow adds

GitLab's own documented model: merge requests into long-lived environment branches
(commonly `staging`, `pre-production`, `production`), with optional release branches for
versioned software. As a branch topology, it looks close to the promotion chain Pipecraft
already generates for trunk-based flows (the `gated` flavor already runs a five-stage chain:
develop → alpha → beta → release → production). The topology (pillar 1) and the CI provider
(pillar 2) are separate axes in the vision's 4x2 matrix, so GitLab Flow does not strictly
require the GitLab CI generator to exist first. Whether it needs new topology code, or
whether the existing promotion chain plus GitLab CI output already covers it, is a Discover
question for whoever picks this up next; this doc does not resolve it.

## Why defer

No user has asked for it. It has never been on a reqts file or roadmap line, unlike GitFlow
(`reqts/goal-gitflow-hotfix.md`) and GitLab CI (`reqts/goal-gitlab-ci.md`), both of which
trace back to the project's original 2025-10 planning docs. Validating it meaningfully most
likely wants the GitLab e2e test bed (issue #616, also blocking `reqts/goal-gitlab-ci.md`)
to exist first, even though the topology itself may not require the GitLab CI provider.

## Non-goals now

Designing the environment-branch topology in detail. Deciding whether it's new generator
code or an existing-chain configuration. Both wait for Discover, not for this filing.
