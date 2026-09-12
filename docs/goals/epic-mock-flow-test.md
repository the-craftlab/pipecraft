```yaml
rung: epic
id: mock-flow-test
title: pipecraft test / local flow simulation
status: proposed
owner: james
updated: 2026-09-11
tracker: local
parent: docs/goals/VISION.md#defer-backlog
```

# Epic mock-flow-test: pipecraft test / local flow simulation

First named in `ROADMAP_PLANNING_SESSION.md` (2025-10, repo then named "flowcraft," deleted
in commit c26faeb, never rebuilt since). James, quoted there: "I also want to be able to
mock and confirm the ENTIRE flow in code and not rely on github... Same for gitlab, etc." A
`pipecraft test` command would simulate a full promotion flow (change detection, version
bump, tag, promote, release) locally, without hitting the GitHub or GitLab API, likely via
something like `act` for the GitHub Actions case.

## Done when

- `pipecraft test` (or equivalent) runs a full promotion cycle against a scratch repo with
  no network calls to GitHub or GitLab.
- The simulation catches the same class of defect the live e2e harness
  (`scripts/e2e/harness.ts`) catches, at a fraction of the setup cost.
- Output is legible enough to debug a failed flow without reading generated YAML directly.

## Won't

- Replacing the live e2e flavors. The e2e harness against real
  `the-craftlab/pipecraft-example-*` repos stays the ground truth; this is a faster local
  first pass, not a substitute.

## Stories

None yet.
