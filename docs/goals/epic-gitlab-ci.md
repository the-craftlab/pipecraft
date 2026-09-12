```yaml
rung: epic
id: gitlab-ci
title: GitLab CI generator
status: active
owner: james
updated: 2026-09-11
tracker: local
parent: docs/goals/VISION.md#provider-coverage
```

# Epic gitlab-ci: GitLab CI generator

`reqts/goal-gitlab-ci.md` (rank 10, repositioned 2026-09-05 from "defer indefinitely" to
"paused until a GitLab test bed exists") already lays out the order of work: the test bed
first (issue #616, a `glab`/REST equivalent of the `gh`-based e2e harness against a
disposable GitLab group), then a second `.gitlab-ci.yml` template tree and a GitLab
replacement for every composite action (detect-changes, calculate-version, create-tag,
promote-branch, create-release). This epic is the container for both once #616 is worked;
nothing here changes that order.

## Done when

- Issue #616 (GitLab e2e test bed) resolves: a disposable GitLab group can be reset and its
  pipeline status read, mirroring what `scripts/e2e/harness.ts` does against
  `the-craftlab/pipecraft-example-*` on GitHub.
- `.gitlab-ci.yml` generation exists behind a seventh e2e flavor.
- `ciProvider: "gitlab"` stops being rejected at `init`/`generate` (currently enforced by
  `tests/integration/init-ci-provider.test.ts` and issue #607's `generate`-side twin) and
  produces real output instead.
- Docs wording changes from "not yet supported; the value is rejected" to reflect real
  support (`reqts/goal-gitlab-ci.md`'s own note on this).

## Won't

- Removing the `ciProvider` enum's `"gitlab"` value at any point; it's a breaking change for
  any config that already carries it (unchanged from `reqts/goal-gitlab-ci.md`).

## Stories

None yet. Issue #616 is the natural first story once this epic moves to `## Active`.
