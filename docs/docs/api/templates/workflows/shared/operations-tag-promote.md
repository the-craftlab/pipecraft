# templates/workflows/shared/operations-tag-promote

## Interfaces

### TagPromoteContext

Defined in: [templates/workflows/shared/operations-tag-promote.ts:14](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/workflows/shared/operations-tag-promote.ts#L14)

#### Properties

##### autoPromote?

```ts
optional autoPromote: Record<string, boolean>;
```

Defined in: [templates/workflows/shared/operations-tag-promote.ts:16](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/workflows/shared/operations-tag-promote.ts#L16)

##### branchFlow

```ts
branchFlow: string[];
```

Defined in: [templates/workflows/shared/operations-tag-promote.ts:15](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/workflows/shared/operations-tag-promote.ts#L15)

##### config?

```ts
optional config: Partial<PipecraftConfig>;
```

Defined in: [templates/workflows/shared/operations-tag-promote.ts:17](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/workflows/shared/operations-tag-promote.ts#L17)

## Functions

### createTagPromoteReleaseOperations()

```ts
function createTagPromoteReleaseOperations(ctx): PathOperationConfig[]
```

Defined in: [templates/workflows/shared/operations-tag-promote.ts:23](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/workflows/shared/operations-tag-promote.ts#L23)

Create tag, promote, and release job operations

#### Parameters

##### ctx

[`TagPromoteContext`](#tagpromotecontext)

#### Returns

[`PathOperationConfig`](../../../utils/ast-path-operations.md#pathoperationconfig)[]
