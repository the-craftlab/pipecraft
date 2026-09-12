# Spike: a GitLab test bed for a .gitlab-ci.yml generator e2e flavor

Issue #616. Scopes the test bed only; changes nothing in the generator. Story:
`docs/tmp/story-616.md`. Bullets 1-4 below are answered from research (this session had no
network access to gitlab.com itself, only to GitHub via MCP and to the open web via
WebSearch/WebFetch — see the story's ASSUMPTION LEDGER). Bullet 5 needs a session with real
GitLab API access and is left open.

## 1. Where the projects live

A gitlab.com group, mirroring how `the-craftlab/pipecraft-example-*` works on GitHub today:
one throwaway project per flavor, all under one group so a single token and a single reset
script cover all of them.

Free-tier limits to confirm live before committing to this (GitLab has changed these
numbers repeatedly; do not trust a specific figure without checking
`https://gitlab.com/-/profile` or the group's usage page once real access exists):

- Compute (CI/CD) minutes per month on the free tier.
- Whether protected-branch rules are available at all on a free-tier group, or gated to a
  paid tier (this changes what `clearBranchProtection`'s GitLab equivalent needs).

Creation/deletion: `glab` (or the REST Projects API, `POST /groups/:id/projects` and
`DELETE /projects/:id`) scripts group creation/deletion the same way
`scripts/e2e/harness.ts` already treats the GitHub repos as disposable and rebuildable.

## 2. Auth

A **Group Access Token** (not a Project Access Token): the harness needs to create and
delete projects within the group, which is a group-level operation a project-scoped token
cannot do.

Scope: `api` (full REST API access). GitLab's narrower scopes (`read_api`,
`read_repository`, `write_repository`) each cover only part of what the harness needs
(project CRUD, protected branches, releases, tags, merge requests); `api` is the
`gh`-equivalent "just works" scope, matching how the existing harness uses a fully
authenticated `gh` rather than a narrowly-scoped token.

Whether group access tokens are available on GitLab's free tier for a top-level group needs
live confirmation; this has changed across GitLab's tiers historically.

Secret name: match the existing convention. The `gh`-based harness relies on the local
`gh auth` session, not a repo secret, for local runs; a CI-run harness would read
`GITLAB_TOKEN` (or `GITLAB_TEST_BED_TOKEN`, to avoid colliding with any other GitLab
integration this org might add later) from repo/environment secrets.

## 3. Harness call mapping

Every `gh`-based call in `scripts/e2e/harness.ts` (line numbers as of this doc's writing),
and its GitLab equivalent:

| Harness function (`scripts/e2e/harness.ts`)                                                                                                                                       | Current `gh` call                                              | GitLab equivalent                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cloneRepo` (:46)                                                                                                                                                                 | `gh repo clone <repo> <dir>`                                   | Plain `git clone` with the token in the URL (`git clone https://oauth2:<token>@gitlab.com/<group>/<project>.git`), or `glab repo clone` for parity. Git itself is provider-agnostic; only the auth wrapper differs.                                                                                                                                                                                                     |
| `setWorkflowWritePerms` (:54)                                                                                                                                                     | `gh api PUT .../actions/permissions/workflow`                  | No direct 1:1. GitHub Actions' "default workflow permissions" toggle has no exact GitLab counterpart; GitLab's job-token scoping (`CI_JOB_TOKEN` project allowlist, `PUT /projects/:id/job_token_scope`) is the closest analogue but solves a different problem (which projects a job token can reach, not what a job is allowed to do to its own repo). Needs its own Discover pass rather than a direct substitution. |
| `clearBranchProtection` (:62)                                                                                                                                                     | `gh api DELETE .../branches/{b}/protection`                    | `DELETE /projects/:id/protected_branches/:name` (Protected Branches API), or `glab api` to the same endpoint.                                                                                                                                                                                                                                                                                                           |
| `deleteAllReleasesAndTags` (:68)                                                                                                                                                  | `gh release list`/`gh release delete` + `git push origin :ref` | `GET`/`DELETE /projects/:id/releases` (Releases API) for releases; `DELETE /projects/:id/repository/tags/:tag_name` (Tags API) or plain `git push origin :refs/tags/<tag>` for tags, same as the GitHub case since git tag deletion is provider-agnostic.                                                                                                                                                               |
| `prove`'s `gatePROpen` (:195)                                                                                                                                                     | `gh pr list --json headRefName`                                | `GET /projects/:id/merge_requests?state=opened&source_branch=...` (Merge Requests API), or `glab mr list`.                                                                                                                                                                                                                                                                                                              |
| `prove`'s `newRelease` (:202)                                                                                                                                                     | `gh release list --json tagName`                               | `GET /projects/:id/releases` (Releases API), or `glab release list`.                                                                                                                                                                                                                                                                                                                                                    |
| Reading pipeline status (not in the current harness; `prove` only infers success from branch/PR/release state via git + `gh api`, never polls GitHub Actions run status directly) | n/a                                                            | `GET /projects/:id/pipelines` / `GET /projects/:id/pipelines/:pipeline_id` (Pipelines API), or `glab ci status`. Only needed if a GitLab flavor's `prove` wants to assert on pipeline success directly rather than inferring it from branch/MR/release state the way the GitHub harness already does.                                                                                                                   |

`glab` (GitLab's official CLI, the `gh` analogue) covers most of the REST calls above
directly; a few (protected branches, job-token scope) may need raw REST via `glab api`
since `glab` doesn't wrap every endpoint the way `gh api` doesn't either.

## 4. Cost and reset time

Not measurable without live access. Once bullet 5 unblocks, capture:

- Wall-clock time for one full `reset` + `prove` cycle against a throwaway project (compare
  to the GitHub harness's baseline, `DEFAULT_TIMEOUT_MS = 12 * 60_000` in
  `scripts/e2e/harness.ts:28`).
- CI minutes consumed per cycle, against whatever the free-tier quota turns out to be (see
  bullet 1).

## 5. Live throwaway-project test — BLOCKED, open

Issue #616 requires: "One throwaway project created, a pipeline observed, and the project
deleted, with the commands pasted." This session has no path to gitlab.com's API (no
network access from its Bash shell, no GitLab MCP tool, no `glab` CLI or `GITLAB_TOKEN`
present — see `docs/tmp/story-616.md`'s ASSUMPTION LEDGER for the confirming commands).

This bullet stays open until either James runs it directly and pastes the commands and
output into `docs/tmp/story-616.md`, or a future session has real GitLab API access.
