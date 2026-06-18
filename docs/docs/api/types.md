# types

PipeCraft Type Definitions

This module contains the core TypeScript interfaces and types used throughout PipeCraft.
These types define the configuration schema, context objects, and domain specifications
for generating CI/CD pipelines with trunk-based development workflows.

## Interfaces

### DomainConfig

Defined in: [types/index.ts:27](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L27)

Configuration for a single domain (monorepo workspace) in a PipeCraft project.

Domains enable path-based change detection in monorepo architectures, allowing
different parts of the codebase to be tested and deployed independently.

#### Example

```typescript
const apiDomain: DomainConfig = {
  paths: ['packages/api/**', 'libs/shared/**'],
  description: 'Backend API services',
  testable: true,
  deployable: true
}
```

#### Properties

##### ~~deployable?~~

```ts
optional deployable: boolean;
```

Defined in: [types/index.ts:71](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L71)

Whether this domain should be deployed.
If true, generates deployment jobs for this domain.

###### Default

```ts
false
```

###### Deprecated

Use `prefixes: ['deploy']` instead for more flexibility

##### description

```ts
description: string
```

Defined in: [types/index.ts:38](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L38)

Human-readable description of the domain's purpose.
Used in workflow comments and documentation.

##### paths

```ts
paths: string[];
```

Defined in: [types/index.ts:32](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L32)

Glob patterns matching files in this domain.
Changes to these paths will trigger domain-specific jobs.

##### prefixes?

```ts
optional prefixes: string[];
```

Defined in: [types/index.ts:55](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L55)

Job prefixes to generate for this domain.
Each prefix generates a customizable placeholder job named `{prefix}-{domain}`.

For example, with domain 'core' and prefixes: ['test', 'deploy', 'lint']:

- test-core (runs when core/ changes)
- deploy-core (runs when core/ changes)
- lint-core (runs when core/ changes)

These are placeholder jobs where you add your own logic in the custom jobs section.
Prefixes provide more flexibility than the boolean flags (testable, deployable, etc).

###### Examples

```ts
;['test', 'deploy', 'remote-test']
```

```ts
;['lint', 'build', 'test', 'deploy', 'e2e']
```

##### ~~remoteTestable?~~

```ts
optional remoteTestable: boolean;
```

Defined in: [types/index.ts:79](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L79)

Whether this domain should be tested remotely after deployment.
If true, generates remote test jobs for this domain.

###### Default

```ts
false
```

###### Deprecated

Use `prefixes: ['remote-test']` instead for more flexibility

##### ~~testable?~~

```ts
optional testable: boolean;
```

Defined in: [types/index.ts:63](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L63)

Whether this domain has tests that should be run.
If true, generates test jobs for this domain.

###### Default

```ts
false
```

###### Deprecated

Use `prefixes: ['test']` instead for more flexibility

---

### PipecraftConfig

Defined in: [types/index.ts:113](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L113)

Complete PipeCraft configuration schema.

This is the main configuration interface loaded from `.pipecraftrc` (YAML or JSON),
`.pipecraftrc.json` (legacy), or the `pipecraft` key in `package.json`.
It defines the entire CI/CD pipeline behavior including branch flow, merge
strategies, domain configuration, versioning, and automated actions.

#### Example

```typescript
const config: PipecraftConfig = {
  ciProvider: 'github',
  mergeStrategy: 'fast-forward',
  requireConventionalCommits: true,
  initialBranch: 'develop',
  finalBranch: 'main',
  branchFlow: ['develop', 'staging', 'main'],
  autoPromote: { staging: true },
  semver: {
    bumpRules: { feat: 'minor', fix: 'patch', breaking: 'major' }
  },
  actions: {
    onDevelopMerge: ['runTests'],
    onStagingMerge: ['runTests', 'calculateVersion']
  },
  domains: {
    api: { paths: ['packages/api/**'], description: 'API', testable: true }
  }
}
```

#### Properties

##### actionSourceMode?

```ts
optional actionSourceMode: "local" | "remote" | "source";
```

Defined in: [types/index.ts:276](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L276)

How workflows should reference PipeCraft actions.

- 'local': Actions copied to ./.github/actions/ (default, full control)
- 'remote': Reference published marketplace actions (e.g., the-craftlab/pipecraft/actions/detect-changes@v1)
- 'source': Use ./actions/ from repo root (internal use only, for PipeCraft's own CI)

###### Default

```ts
'local'
```

###### Example

```typescript
// User repos (local mode)
actionSourceMode: 'local'
// Generates: uses: ./.github/actions/detect-changes

// User repos (remote mode)
actionSourceMode: 'remote'
actionVersion: 'v1.2.3'
// Generates: uses: the-craftlab/pipecraft/actions/detect-changes@v1.2.3

// PipeCraft repo only (source mode)
actionSourceMode: 'source'
// Generates: uses: ./actions/detect-changes
```

##### actionVersion?

```ts
optional actionVersion: string;
```

Defined in: [types/index.ts:285](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L285)

Version/tag to use when actionSourceMode is 'remote'.
Pins workflows to a specific marketplace action version.

###### Example

```ts
'v1.2.3', 'v1', 'main'
```

###### Default

```ts
'v1'
```

##### autoPromote?

```ts
optional autoPromote: boolean | Record<string, boolean>;
```

Defined in: [types/index.ts:164](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L164)

Auto-promote configuration for branch promotions.

- boolean: Enable/disable auto-promotion for all branches
- Record: Per-branch auto-promote settings (e.g., `{ staging: true, main: false }`)

When enabled, code is automatically promoted (fast-forwarded) to the next branch
in the flow after checks pass. When disabled, a PR is created for manual review
and the promotion happens when the PR is merged.

###### Default

```ts
false
```

##### branchFlow

```ts
branchFlow: string[];
```

Defined in: [types/index.ts:152](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L152)

Ordered list of branches in the promotion flow from initial to final.
Must start with initialBranch and end with finalBranch.

###### Example

```ts
;['develop', 'staging', 'main']
```

##### ciProvider

```ts
ciProvider: 'github' | 'gitlab'
```

Defined in: [types/index.ts:118](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L118)

CI/CD provider platform.
Currently 'github' is fully supported, 'gitlab' support is planned.

##### domains

```ts
domains: Record<string, DomainConfig>
```

Defined in: [types/index.ts:210](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L210)

Domain definitions for monorepo path-based change detection.
Each domain represents a logical part of the codebase with its own
test and deployment requirements.

##### finalBranch

```ts
finalBranch: string
```

Defined in: [types/index.ts:144](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L144)

The final production branch (typically 'main' or 'master').
This is the last branch in the promotion flow.

##### initialBranch

```ts
initialBranch: string
```

Defined in: [types/index.ts:138](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L138)

The first branch in the promotion flow (typically 'develop' or 'dev').
All feature branches merge into this branch.

##### mergeMethod?

```ts
optional mergeMethod:
  | "merge"
  | "auto"
  | "squash"
  | "rebase"
| Record<string, "merge" | "auto" | "squash" | "rebase">;
```

Defined in: [types/index.ts:176](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L176)

Git merge method for auto-merge operations.

- 'auto': Use fast-forward when possible, merge otherwise
- 'merge': Always create merge commit
- 'squash': Squash all commits into one
- 'rebase': Rebase and fast-forward

Can be set globally or per-branch.

###### Default

```ts
'auto'
```

##### mergeStrategy

```ts
mergeStrategy: 'fast-forward' | 'merge'
```

Defined in: [types/index.ts:125](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L125)

Git merge strategy for branch promotions.

- 'fast-forward': Requires linear history, fails if branches diverged
- 'merge': Creates merge commits

##### ~~packageManager?~~

```ts
optional packageManager: "npm" | "yarn" | "pnpm";
```

Defined in: [types/index.ts:220](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L220)

Package manager used for dependency installation.

###### Deprecated

This field is no longer used by PipeCraft workflows.
It was originally intended for JavaScript/Node.js projects but
PipeCraft now supports language-agnostic workflows. Existing
configs with this field will continue to work, but it has no effect.

##### rebuild?

```ts
optional rebuild: object;
```

Defined in: [types/index.ts:291](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L291)

Idempotency and rebuild configuration.
Controls when workflows should be regenerated based on config/template changes.

###### cacheFile

```ts
cacheFile: string
```

Path to cache file storing previous config hash.

###### enabled

```ts
enabled: boolean
```

Whether idempotency checking is enabled.
If true, workflows are only regenerated when config or templates change.

###### forceRegenerate

```ts
forceRegenerate: boolean
```

Force regeneration even if hash matches.
Useful for debugging or manual overrides.

###### hashAlgorithm

```ts
hashAlgorithm: 'md5' | 'sha1' | 'sha256'
```

Hashing algorithm for detecting config changes.

###### ignorePatterns

```ts
ignorePatterns: string[];
```

Patterns to ignore when calculating config hash.

###### skipIfUnchanged

```ts
skipIfUnchanged: boolean
```

Skip regeneration if config hash hasn't changed.

###### watchMode

```ts
watchMode: boolean
```

Enable watch mode for automatic regeneration on config changes.

##### requireConventionalCommits

```ts
requireConventionalCommits: boolean
```

Defined in: [types/index.ts:132](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L132)

Whether to enforce conventional commit message format.
If true, commit messages must follow the Conventional Commits specification.

###### See

https://www.conventionalcommits.org/

##### runtime?

```ts
optional runtime: object;
```

Defined in: [types/index.ts:236](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L236)

Runtime tool versions for generated CI/CD workflows.

Controls the `NODE_VERSION` / `PNPM_VERSION` workflow env vars (and the
version job's `node-version`) without hand-editing generated files. When a
value is set here it is authoritative — regeneration overwrites the env var
with the configured value; when unset, the existing value is preserved and
falls back to the defaults.

###### nodeVersion?

```ts
optional nodeVersion: string;
```

Node.js version for workflows. Accepts a major (e.g. `'22'`) or an exact
version (e.g. `'22.18.0'`).

###### Default

```ts
'22'
```

###### pnpmVersion?

```ts
optional pnpmVersion: string;
```

pnpm version for workflows (used when the project installs with pnpm).
Accepts a major (e.g. `'10'`) or an exact version (e.g. `'10.6.2'`).

###### Default

```ts
'10'
```

###### Example

```typescript
runtime: { nodeVersion: '22', pnpmVersion: '10' }
```

##### semver

```ts
semver: object
```

Defined in: [types/index.ts:198](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L198)

Semantic versioning configuration.
Maps conventional commit types to version bump levels.

###### bumpRules

```ts
bumpRules: Record<string, string>
```

Mapping of commit types to semver bump levels (major, minor, patch).

###### Example

```typescript
semver: {
  bumpRules: {
    feat: 'minor',      // New features bump minor version
    fix: 'patch',        // Bug fixes bump patch version
    breaking: 'major'    // Breaking changes bump major version
  }
}
```

##### versioning?

```ts
optional versioning: object;
```

Defined in: [types/index.ts:334](https://github.com/the-craftlab/pipecraft/blob/main/src/types/index.ts#L334)

Version management configuration using release-it.
Enables automatic version bumping, tagging, and changelog generation.

###### autoPush

```ts
autoPush: boolean
```

Automatically push tags to remote after creation.

###### autoTag

```ts
autoTag: boolean
```

Automatically create git tags for new versions.

###### ~~bumpRules?~~

```ts
optional bumpRules: Record<string, string>;
```

Mapping of commit types to version bump levels.

###### Deprecated

Use semver.bumpRules instead. This field is ignored if semver.bumpRules is present.

###### changelog

```ts
changelog: boolean
```

Generate CHANGELOG.md from conventional commits.

###### conventionalCommits

```ts
conventionalCommits: boolean
```

Use conventional commits for version calculation.

###### enabled

```ts
enabled: boolean
```

Whether version management is enabled.

###### releaseItConfig

```ts
releaseItConfig: string
```

Path to release-it configuration file.
