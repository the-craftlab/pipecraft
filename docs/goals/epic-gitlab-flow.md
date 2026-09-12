```yaml
rung: epic
id: gitlab-flow
title: GitLab Flow topology support
status: proposed
owner: james
updated: 2026-09-11
tracker: local
parent: docs/goals/VISION.md#flow-topology-coverage
```

# Epic gitlab-flow: GitLab Flow topology support

`reqts/goal-gitlab-flow.md` (2026-09-11) is the first record of this anywhere in the repo;
`rg -i "gitlab flow"` returned zero hits before that doc. GitLab's documented model uses
long-lived environment branches and optional release branches, which may already be close
to the promotion chain Pipecraft generates for trunk-based flows (the `gated` flavor runs a
five-stage chain today). Whether this needs new topology code or mostly configuration on
the existing chain is undecided; that's Discover work for whoever picks this up.

## Done when

- Discover resolves whether GitLab Flow is new topology code or an existing-chain
  configuration, and records the answer in this file or a story under it.
- Whatever the answer, an e2e flavor proves the resulting branch/promotion behavior matches
  GitLab Flow's environment-branch model.

## Won't

- Building this before the GitLab e2e test bed (issue #616) exists, if Discover concludes
  the topology needs GitLab CI output to validate meaningfully rather than GitHub Actions.

## Stories

None yet.
