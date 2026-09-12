```yaml
rung: epic
id: setup-wizard
title: interactive .pipecraftrc setup wizard
status: proposed
owner: james
updated: 2026-09-11
tracker: local
parent: docs/goals/VISION.md#defer-backlog
```

# Epic setup-wizard: interactive .pipecraftrc setup wizard

First named in `ROADMAP_PLANNING_SESSION.md` (2025-10, repo then named "flowcraft," deleted
in commit c26faeb, never rebuilt since). James, quoted there: "I would like an interactive
template builder for the website which generates the right config commands." James,
2026-09-11, on its actual job: it picks a cell in the flow-topology x provider matrix
(`docs/tmp/vision-draft.md` pillars 1-2) and answers most of the remaining `.pipecraftrc`
fields with baked-in defaults for that cell, so a user drops the generated file in and runs
`generate` without answering the full config surface by hand.

## Done when

- A wizard (CLI prompt flow, web builder, or both) asks only for the flow topology and CI
  provider, then generates a working `.pipecraftrc` with sensible defaults for everything
  else.
- The generated config passes the same validation `pipecraft init` already runs.
- At least the two currently-shipped cells (trunk-based/GitHub Actions, GitHub
  Flow/GitHub Actions) are covered end to end.

## Won't

- Covering cells that don't build yet (GitFlow, GitLab Flow, GitLab CI) until those epics
  ship; the wizard tracks what's actually generatable, not the full matrix.

## Stories

None yet.
