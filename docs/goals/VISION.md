```yaml
rung: vision
title: PipeCraft generates the GitHub Actions pipeline a team would otherwise hand-roll
status: active
owner: james
updated: 2026-09-27
```

# Vision

A team adopting Nx or Turbo still has to decide how branches promote, when a version cuts, which tests run for which change, and what blocks a bad push from reaching production. PipeCraft has made those decisions already: `npx pipecraft init --yes && npx pipecraft generate` writes GitHub Actions workflows into the repository that encode them, and those workflows belong to that repository from the moment they land, editable like any other file.

The generated pipeline runs one job per changed domain (`changes` turns path globs into flags the rest of the jobs gate on), resolves the next semantic version from conventional commits in one place, and gates a `promote` PR on every prerequisite job passing. Only a merged pull request cuts a release; a commit pushed straight to a branch runs tests and reports the version it would have used, then stops, so a hotfix typed on the wrong branch cannot ship.

## Provider coverage

GitHub Actions is today's only generated target. `gitlab-ci` (issue #616) is the active epic that adds GitLab CI as a second provider, proven against an end-to-end test bed before any other provider work starts.

## Flow topology coverage

Trunk-based promotion (`develop → staging → main`) is the only branch topology PipeCraft generates today. `gitflow-hotfix` (GitFlow with a hotfix branch) and `gitlab-flow` (GitLab Flow) are proposed additions, both blocked on the GitLab CI e2e test bed landing first.

## Defer backlog

`setup-wizard` (an interactive `.pipecraftrc` setup wizard) and `mock-flow-test` (a local flow simulation for `pipecraft test`) are proposed, unblocked, and not yet scheduled ahead of the provider and flow-topology work above.

# Definition of done

A team runs `npx pipecraft init --yes && npx pipecraft generate` against a fresh repository, on any provider PipeCraft supports, and gets a working pipeline enforcing PipeCraft's promotion, versioning, and change-gating decisions on the first push, with no hand-written YAML.

# Hard constraints

- A generated workflow is the repository's own file from the moment it lands: PipeCraft edits it by regenerating, a person edits it by hand, and a regeneration preserves custom jobs rather than overwriting them.
- Only a merged pull request cuts a release. A direct push to a promotion branch never tags a version.
- A version comes from conventional commits, resolved in the pipeline; no local command produces a tag CI would disagree with.

# Out of scope

Anything specific to a project using PipeCraft belongs in that project's own `docs/goals/`, not here. This vision covers the generator itself: which providers and flow topologies it targets, not what any adopting team builds with the output.

# Standing rules

Evidence before assertion, same as every other repo James works in. A claim about what the generator produces gets a command run against `npx pipecraft generate`'s real output, not a memory of an earlier version.
