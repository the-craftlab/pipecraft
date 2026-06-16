# utils/github-setup

GitHub Repository Setup and Configuration

This module provides utilities for setting up and configuring GitHub repositories
for use with PipeCraft workflows. It handles:

- Repository information extraction from git remotes
- GitHub authentication token management
- Workflow permissions configuration
- Repository merge settings (strategies, auto-merge, PR updates)
- Merge commit message format settings
- Branch protection rules setup
- Auto-merge enablement (two-layer system)

These setup utilities ensure that GitHub repositories have the correct permissions
and settings for PipeCraft workflows to function properly, including:

- Workflows can create pull requests
- Merge commits always use PR titles (not individual commit messages)
- Auto-merge is enabled based on .pipecraftrc config
- Branch protection is configured appropriately
- Required status checks are enforced

## Auto-Merge Two-Layer System

Auto-merge in GitHub works with two layers:

1. **Repository-Level Setting** (`allow_auto_merge`):

   - Must be ON for auto-merge to be available at all
   - Controls whether the "Enable auto-merge" button appears on PRs
   - Configured by this module based on .pipecraftrc

2. **Per-PR Activation**:
   - Must be explicitly enabled on each PR (via button, CLI, or API)
   - Pipecraft workflows automatically enable it for configured branches
   - Configured per-branch in .pipecraftrc autoPromote setting

Example config:

```json
{
  "branchFlow": ["develop", "staging", "main"],
  "autoPromote": {
    "staging": true, // Auto-merge PRs to staging
    "main": true // Auto-merge PRs to main
  }
}
```

Result: develop requires manual review, staging and main auto-merge when checks pass

## Functions

### configureBranchProtection()

```ts
function configureBranchProtection(repoInfo, token, autoApply): Promise<void>
```

Defined in: [utils/github-setup.ts:1171](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L1171)

Configure branch protection for branches that need auto-merge

#### Parameters

##### repoInfo

`RepositoryInfo`

##### token

`string`

##### autoApply

`boolean`

#### Returns

`Promise`\<`void`\>

---

### displaySettingsComparison()

```ts
function displaySettingsComparison(current, recommended, gaps): void
```

Defined in: [utils/github-setup.ts:933](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L933)

Display a comparison table of current vs recommended settings.

#### Parameters

##### current

`RepositorySettings`

##### recommended

`RepositorySettings`

##### gaps

`Partial`\<`RepositorySettings`\>

#### Returns

`void`

---

### enableAutoMerge()

```ts
function enableAutoMerge(owner, repo, token): Promise<boolean>
```

Defined in: [utils/github-setup.ts:1125](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L1125)

Enable auto-merge feature for the repository

#### Parameters

##### owner

`string`

##### repo

`string`

##### token

`string`

#### Returns

`Promise`\<`boolean`\>

---

### formatOrgActionsLockMessage()

```ts
function formatOrgActionsLockMessage(owner, apiError?): string
```

Defined in: [utils/github-setup.ts:404](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L404)

Build an actionable, human-readable message explaining that an organization
policy is blocking the repository's workflow permissions, and exactly how an
org admin can unblock it. Used both by `setup-github` (on a 409 write) and by
`doctor` (when it detects the org-level lock proactively).

#### Parameters

##### owner

`string`

Repository owner (the organization name)

##### apiError?

`string`

Optional raw API error text to append for debugging

#### Returns

`string`

A multi-line actionable message

---

### getBranchProtection()

```ts
function getBranchProtection(owner, repo, branch, token): Promise<BranchProtectionRules | null>
```

Defined in: [utils/github-setup.ts:1047](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L1047)

Get branch protection rules

#### Parameters

##### owner

`string`

##### repo

`string`

##### branch

`string`

##### token

`string`

#### Returns

`Promise`\<`BranchProtectionRules` \| `null`\>

---

### getGitHubToken()

```ts
function getGitHubToken(): string
```

Defined in: [utils/github-setup.ts:291](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L291)

Get GitHub authentication token from environment or GitHub CLI.

Attempts to retrieve a GitHub personal access token from multiple sources
in this order:

1. GITHUB_TOKEN environment variable
2. GH_TOKEN environment variable
3. GitHub CLI (`gh auth token`) if authenticated

The token is required for GitHub API calls to configure repository settings.
Token must have 'repo' and 'workflow' scopes.

#### Returns

`string`

GitHub personal access token

#### Throws

If no token is found in any source

#### Example

```typescript
// Set token via environment
process.env.GITHUB_TOKEN = 'ghp_xxxxxxxxxxxx'
const token = getGitHubToken()

// Or authenticate with GitHub CLI first
// $ gh auth login
const token = getGitHubToken() // Uses gh CLI token
```

---

### getMergeCommitSettings()

```ts
function getMergeCommitSettings(owner, repo, token): Promise<RepositorySettings>
```

Defined in: [utils/github-setup.ts:571](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L571)

Get current merge commit message settings for the repository.

Retrieves the default formats for merge and squash commit messages.
These settings control how GitHub formats commit messages when PRs are merged.

#### Parameters

##### owner

`string`

Repository owner (organization or user)

##### repo

`string`

Repository name

##### token

`string`

GitHub authentication token

#### Returns

`Promise`\<`RepositorySettings`\>

Current merge commit settings

#### Throws

If the API call fails

#### Example

```typescript
const settings = await getMergeCommitSettings('owner', 'repo', token)
console.log(settings.squash_merge_commit_title) // 'PR_TITLE' or 'COMMIT_OR_PR_TITLE'
```

---

### getOrgWorkflowPermissions()

```ts
function getOrgWorkflowPermissions(org, token): Promise<WorkflowPermissions | null>
```

Defined in: [utils/github-setup.ts:432](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L432)

Get organization-level workflow permissions.

Used to proactively detect an org-level lock from a read-only context (e.g.
`doctor`) without attempting a write that would 409. Returns `null` when the
org endpoint is not accessible — which is the expected case for personal
accounts (404) or tokens lacking org-admin scope (403). Callers should treat
`null` as "indeterminate" and fall back to their default behavior.

#### Parameters

##### org

`string`

Organization (owner) name

##### token

`string`

GitHub token

#### Returns

`Promise`\<`WorkflowPermissions` \| `null`\>

The org workflow permissions, or null if not determinable

---

### getRecommendedRepositorySettings()

```ts
function getRecommendedRepositorySettings(): RepositorySettings
```

Defined in: [utils/github-setup.ts:817](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L817)

Get Pipecraft's recommended repository settings.

These are the settings that work best with Pipecraft workflows:

- Allow auto-merge: ON if any branch has autoPromote in config, OFF otherwise
- Always suggest updating PR branches: ON
- Allow merge commits: OFF
- Allow rebase merging: OFF
- Allow squash merging: ON
- Squash merge commit title: PR_TITLE
- Squash merge commit message: COMMIT_MESSAGES (PR title + commit details)

#### Returns

`RepositorySettings`

---

### getRepositoryInfo()

```ts
function getRepositoryInfo(): RepositoryInfo
```

Defined in: [utils/github-setup.ts:238](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L238)

Extract GitHub repository information from git remote configuration.

Parses the git remote URL for the 'origin' remote to extract owner and
repository name. Supports both HTTPS and SSH GitHub URLs:

- HTTPS: https://github.com/owner/repo.git
- SSH: git@github.com:owner/repo.git

This information is required for GitHub API calls to configure repository
settings and permissions.

#### Returns

`RepositoryInfo`

Repository information object

#### Throws

If origin remote is not configured

#### Throws

If remote URL is not a valid GitHub URL

#### Example

```typescript
const info = getRepositoryInfo()
console.log(`Owner: ${info.owner}, Repo: ${info.repo}`)
// Owner: jamesvillarrubia, Repo: pipecraft
```

---

### getRepositorySettings()

```ts
function getRepositorySettings(owner, repo, token): Promise<RepositorySettings>
```

Defined in: [utils/github-setup.ts:832](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L832)

Get current repository settings from GitHub API.

#### Parameters

##### owner

`string`

##### repo

`string`

##### token

`string`

#### Returns

`Promise`\<`RepositorySettings`\>

---

### getRequiredMergeCommitChanges()

```ts
function getRequiredMergeCommitChanges(currentSettings): RepositorySettings | null
```

Defined in: [utils/github-setup.ts:665](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L665)

Determine required merge commit setting changes without prompting.

Checks if merge commit settings match PipeCraft's recommended configuration:

- Always use PR title for squash and merge commits
- This ensures consistent commit messages regardless of commit count
- Only configures settings for enabled merge strategies

#### Parameters

##### currentSettings

`RepositorySettings`

Current merge commit settings

#### Returns

`RepositorySettings` \| `null`

Changes object if changes needed, null if already correct

#### Example

```typescript
const settings = await getMergeCommitSettings(owner, repo, token)
const changes = getRequiredMergeCommitChanges(settings)
if (changes) {
  await updateMergeCommitSettings(owner, repo, token, changes)
}
```

---

### getRequiredPermissionChanges()

```ts
function getRequiredPermissionChanges(currentPermissions): Partial<WorkflowPermissions> | null
```

Defined in: [utils/github-setup.ts:456](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L456)

Determine required permission changes without prompting
Returns: changes object if changes needed, null if already correct

#### Parameters

##### currentPermissions

`WorkflowPermissions`

#### Returns

`Partial`\<`WorkflowPermissions`\> \| `null`

---

### getSettingsGaps()

```ts
function getSettingsGaps(current, recommended): Partial<RepositorySettings>
```

Defined in: [utils/github-setup.ts:893](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L893)

Compare current settings with recommended settings and return differences.

#### Parameters

##### current

`RepositorySettings`

##### recommended

`RepositorySettings`

#### Returns

`Partial`\<`RepositorySettings`\>

---

### getWorkflowPermissions()

```ts
function getWorkflowPermissions(owner, repo, token): Promise<WorkflowPermissions>
```

Defined in: [utils/github-setup.ts:319](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L319)

Get current workflow permissions

#### Parameters

##### owner

`string`

##### repo

`string`

##### token

`string`

#### Returns

`Promise`\<`WorkflowPermissions`\>

---

### isOrgActionsPermissionLock()

```ts
function isOrgActionsPermissionLock(status): boolean
```

Defined in: [utils/github-setup.ts:390](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L390)

Whether an HTTP status from the Actions workflow-permissions API indicates an
organization-level policy lock.

GitHub returns 409 Conflict when a repository tries to enable a workflow
permission (e.g. "Allow GitHub Actions to create and approve pull requests")
that the parent organization has disabled. The repo-level setting cannot be
changed until an org admin enables it at the organization level.

#### Parameters

##### status

`number`

HTTP status code from the GitHub Actions permissions API

#### Returns

`boolean`

true if the status is the org-policy conflict (409)

---

### promptApplySettings()

```ts
function promptApplySettings(gaps): Promise<'declined' | 'apply'>
```

Defined in: [utils/github-setup.ts:1025](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L1025)

Prompt user whether to apply recommended settings.

#### Parameters

##### gaps

`Partial`\<`RepositorySettings`\>

#### Returns

`Promise`\<`"declined"` \| `"apply"`\>

---

### promptMergeCommitChanges()

```ts
function promptMergeCommitChanges(currentSettings): Promise<RepositorySettings | 'declined' | null>
```

Defined in: [utils/github-setup.ts:707](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L707)

Display current merge commit settings and prompt for changes.

Shows the user their current merge commit message format settings and
asks if they want to change them to PipeCraft's recommended configuration.
Only prompts for settings that are relevant to enabled merge strategies.

#### Parameters

##### currentSettings

`RepositorySettings`

Current merge commit settings

#### Returns

`Promise`\<`RepositorySettings` \| `"declined"` \| `null`\>

Changes object if user accepted, 'declined' if declined, null if already correct

#### Example

```typescript
const settings = await getMergeCommitSettings(owner, repo, token)
const changes = await promptMergeCommitChanges(settings)
if (changes && changes !== 'declined') {
  await updateMergeCommitSettings(owner, repo, token, changes)
}
```

---

### promptPermissionChanges()

```ts
function promptPermissionChanges(
  currentPermissions
): Promise<Partial<WorkflowPermissions> | 'declined' | null>
```

Defined in: [utils/github-setup.ts:484](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L484)

Display current permissions and prompt for changes
Returns: changes object if user accepted changes, 'declined' if user declined, null if already correct

#### Parameters

##### currentPermissions

`WorkflowPermissions`

#### Returns

`Promise`\<`Partial`\<`WorkflowPermissions`\> \| `"declined"` \| `null`\>

---

### setupGitHubPermissions()

```ts
function setupGitHubPermissions(autoApply): Promise<void>
```

Defined in: [utils/github-setup.ts:1261](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L1261)

Main setup function

#### Parameters

##### autoApply

`boolean` = `false`

#### Returns

`Promise`\<`void`\>

---

### shouldEnableAutoMerge()

```ts
function shouldEnableAutoMerge(): boolean
```

Defined in: [utils/github-setup.ts:781](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L781)

Check if auto-merge should be enabled based on .pipecraftrc config.

Auto-merge should be enabled at the repository level if ANY branch
has autoPromote configured in the config file.

#### Returns

`boolean`

---

### updateBranchProtection()

```ts
function updateBranchProtection(owner, repo, branch, token): Promise<void>
```

Defined in: [utils/github-setup.ts:1080](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L1080)

Update branch protection rules to enable auto-merge

#### Parameters

##### owner

`string`

##### repo

`string`

##### branch

`string`

##### token

`string`

#### Returns

`Promise`\<`void`\>

---

### updateMergeCommitSettings()

```ts
function updateMergeCommitSettings(owner, repo, token, settings): Promise<void>
```

Defined in: [utils/github-setup.ts:622](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L622)

Update merge commit message settings for the repository.

Configures how GitHub formats commit messages when PRs are merged.
PipeCraft recommends using PR_TITLE to ensure consistent commit messages
regardless of whether a PR has one or multiple commits.

#### Parameters

##### owner

`string`

Repository owner (organization or user)

##### repo

`string`

Repository name

##### token

`string`

GitHub authentication token

##### settings

`RepositorySettings`

Merge commit settings to apply

#### Returns

`Promise`\<`void`\>

#### Throws

If the API call fails

#### Example

```typescript
await updateMergeCommitSettings('owner', 'repo', token, {
  squash_merge_commit_title: 'PR_TITLE',
  merge_commit_title: 'PR_TITLE'
})
```

---

### updateRepositorySettings()

```ts
function updateRepositorySettings(owner, repo, token, settings): Promise<void>
```

Defined in: [utils/github-setup.ts:867](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L867)

Update repository settings via GitHub API.

#### Parameters

##### owner

`string`

##### repo

`string`

##### token

`string`

##### settings

`Partial`\<`RepositorySettings`\>

#### Returns

`Promise`\<`void`\>

---

### updateWorkflowPermissions()

```ts
function updateWorkflowPermissions(owner, repo, token, permissions): Promise<void>
```

Defined in: [utils/github-setup.ts:346](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/github-setup.ts#L346)

Update workflow permissions

#### Parameters

##### owner

`string`

##### repo

`string`

##### token

`string`

##### permissions

`Partial`\<`WorkflowPermissions`\>

#### Returns

`Promise`\<`void`\>
