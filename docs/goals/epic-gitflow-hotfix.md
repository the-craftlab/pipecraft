```yaml
rung: epic
id: gitflow-hotfix
title: GitFlow with hotfix branches
status: proposed
owner: james
updated: 2026-09-11
tracker: local
parent: docs/goals/VISION.md#flow-topology-coverage
```

# Epic gitflow-hotfix: GitFlow with hotfix branches

`reqts/goal-gitflow-hotfix.md` deferred this on 2026-09-04 (value 2, feasibility 2) because
every hotfix design changes the version model that all six e2e flavors depend on, and no
issue asked for it. Both conditions have changed: version threading (rank 7) landed and
merged as story #631, and the flow now has a named place in `docs/tmp/vision-draft.md`'s
flow-topology pillar (trunk-based and GitHub Flow ship; GitFlow and GitLab Flow are the two
deferred topologies). This epic is the container for actually building it, not yet started.

## Done when

- A `hotfix/*` branch cut from the final branch versions as a patch on the released version.
- The hotfix merges to the final branch and back-merges to the initial branch.
- `promote` has a defined rule for what happens when the initial branch is behind the
  hotfix's target.
- A seventh (or extended) e2e flavor proves the full cut-merge-back-merge-release cycle.

## Won't

- Release branches with their own version lines (`reqts/goal-gitflow-hotfix.md` non-goal,
  unchanged).
- Multiple concurrent hotfixes (same non-goal, unchanged).

## Stories

None yet.
