# templates/workflows/shared/operations-domain-jobs

## Interfaces

### DomainJobsContext

Defined in: [templates/workflows/shared/operations-domain-jobs.ts:13](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-domain-jobs.ts#L13)

#### Properties

##### domains

```ts
domains: Record<string, any>
```

Defined in: [templates/workflows/shared/operations-domain-jobs.ts:14](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-domain-jobs.ts#L14)

## Functions

### createDomainDeployJobOperations()

```ts
function createDomainDeployJobOperations(ctx): PathOperationConfig[]
```

Defined in: [templates/workflows/shared/operations-domain-jobs.ts:134](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-domain-jobs.ts#L134)

Create deploy job operations for deployable domains

#### Parameters

##### ctx

[`DomainJobsContext`](#domainjobscontext)

#### Returns

[`PathOperationConfig`](../../../utils/ast-path-operations.md#pathoperationconfig)[]

---

### createDomainRemoteTestJobOperations()

```ts
function createDomainRemoteTestJobOperations(ctx): PathOperationConfig[]
```

Defined in: [templates/workflows/shared/operations-domain-jobs.ts:180](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-domain-jobs.ts#L180)

Create remote test job operations for remotely testable domains

#### Parameters

##### ctx

[`DomainJobsContext`](#domainjobscontext)

#### Returns

[`PathOperationConfig`](../../../utils/ast-path-operations.md#pathoperationconfig)[]

---

### createDomainTestJobOperations()

```ts
function createDomainTestJobOperations(ctx): PathOperationConfig[]
```

Defined in: [templates/workflows/shared/operations-domain-jobs.ts:88](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-domain-jobs.ts#L88)

Create test job operations for each domain

#### Parameters

##### ctx

[`DomainJobsContext`](#domainjobscontext)

#### Returns

[`PathOperationConfig`](../../../utils/ast-path-operations.md#pathoperationconfig)[]

---

### createPrefixedDomainJobOperations()

```ts
function createPrefixedDomainJobOperations(ctx): PathOperationConfig[]
```

Defined in: [templates/workflows/shared/operations-domain-jobs.ts:27](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-domain-jobs.ts#L27)

Create placeholder job operations for domains with custom prefixes

Generates jobs based on the `prefixes` field in domain config.
For example, with domain 'core' and prefixes ['lint', 'build', 'test'],
this creates: lint-core, build-core, test-core

#### Parameters

##### ctx

[`DomainJobsContext`](#domainjobscontext)

Context with domain configurations

#### Returns

[`PathOperationConfig`](../../../utils/ast-path-operations.md#pathoperationconfig)[]

Array of path operations for all prefix-based jobs

---

### getDomainJobNames()

```ts
function getDomainJobNames(domains): object
```

Defined in: [templates/workflows/shared/operations-domain-jobs.ts:231](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-domain-jobs.ts#L231)

Get list of all domain job names for dependency management

Supports both legacy boolean flags (testable, deployable, remoteTestable)
and new flexible prefixes array.

#### Parameters

##### domains

`Record`\<`string`, `any`\>

#### Returns

`object`

Object with arrays of job names categorized by type

##### allJobsByPrefix

```ts
allJobsByPrefix: Record<string, string[]>
```

##### deployJobs

```ts
deployJobs: string[];
```

##### remoteTestJobs

```ts
remoteTestJobs: string[];
```

##### testJobs

```ts
testJobs: string[];
```
