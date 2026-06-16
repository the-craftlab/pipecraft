# templates/workflows/shared/operations-header

## Interfaces

### HeaderContext

Defined in: [templates/workflows/shared/operations-header.ts:11](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-header.ts#L11)

#### Properties

##### branchFlow

```ts
branchFlow: string[];
```

Defined in: [templates/workflows/shared/operations-header.ts:12](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-header.ts#L12)

##### nodeVersion?

```ts
optional nodeVersion: string;
```

Defined in: [templates/workflows/shared/operations-header.ts:17](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-header.ts#L17)

Node version for the pipeline (from config.runtime, or the existing file).
Falls back to PipeCraft defaults when not provided.

##### nodeVersionFromConfig?

```ts
optional nodeVersionFromConfig: boolean;
```

Defined in: [templates/workflows/shared/operations-header.ts:28](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-header.ts#L28)

When true, nodeVersion came from config.runtime and is authoritative:
regeneration overwrites env.NODE_VERSION instead of preserving the existing
value. When false/undefined the existing value is preserved.

##### pnpmVersion?

```ts
optional pnpmVersion: string;
```

Defined in: [templates/workflows/shared/operations-header.ts:22](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-header.ts#L22)

pnpm version for the pipeline (from config.runtime, or the existing file).
Falls back to PipeCraft defaults when not provided.

##### pnpmVersionFromConfig?

```ts
optional pnpmVersionFromConfig: boolean;
```

Defined in: [templates/workflows/shared/operations-header.ts:30](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-header.ts#L30)

As nodeVersionFromConfig, for env.PNPM_VERSION.

## Functions

### createHeaderOperations()

```ts
function createHeaderOperations(ctx): PathOperationConfig[]
```

Defined in: [templates/workflows/shared/operations-header.ts:36](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-header.ts#L36)

Create workflow header operations (name, run-name, on triggers)

#### Parameters

##### ctx

[`HeaderContext`](#headercontext)

#### Returns

[`PathOperationConfig`](../../../utils/ast-path-operations.md#pathoperationconfig)[]
