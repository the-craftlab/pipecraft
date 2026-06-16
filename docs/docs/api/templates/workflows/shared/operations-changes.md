# templates/workflows/shared/operations-changes

## Interfaces

### ChangesContext

Defined in: [templates/workflows/shared/operations-changes.ts:21](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-changes.ts#L21)

#### Properties

##### baseRef?

```ts
optional baseRef: string;
```

Defined in: [templates/workflows/shared/operations-changes.ts:23](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-changes.ts#L23)

##### config?

```ts
optional config: Partial<PipecraftConfig>;
```

Defined in: [templates/workflows/shared/operations-changes.ts:24](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-changes.ts#L24)

##### domains

```ts
domains: Record<string, any>
```

Defined in: [templates/workflows/shared/operations-changes.ts:22](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-changes.ts#L22)

## Functions

### createChangesJobOperation()

```ts
function createChangesJobOperation(ctx): PathOperationConfig
```

Defined in: [templates/workflows/shared/operations-changes.ts:33](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/operations-changes.ts#L33)

Create the changes detection job operation.

Embeds domain configuration directly into the pipeline YAML at generation time.
The detect-changes action receives this as structured input.

#### Parameters

##### ctx

[`ChangesContext`](#changescontext)

#### Returns

[`PathOperationConfig`](../../../utils/ast-path-operations.md#pathoperationconfig)
