# templates/workflows/shared/operations-version

## Interfaces

### VersionContext

Defined in: [templates/workflows/shared/operations-version.ts:14](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/workflows/shared/operations-version.ts#L14)

#### Properties

##### baseRef?

```ts
optional baseRef: string;
```

Defined in: [templates/workflows/shared/operations-version.ts:16](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/workflows/shared/operations-version.ts#L16)

##### config?

```ts
optional config: Partial<PipecraftConfig>;
```

Defined in: [templates/workflows/shared/operations-version.ts:17](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/workflows/shared/operations-version.ts#L17)

##### testJobNames

```ts
testJobNames: string[];
```

Defined in: [templates/workflows/shared/operations-version.ts:15](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/workflows/shared/operations-version.ts#L15)

## Functions

### createVersionJobOperation()

```ts
function createVersionJobOperation(ctx): PathOperationConfig
```

Defined in: [templates/workflows/shared/operations-version.ts:23](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/workflows/shared/operations-version.ts#L23)

Create the version calculation job operation

#### Parameters

##### ctx

[`VersionContext`](#versioncontext)

#### Returns

[`PathOperationConfig`](../../../utils/ast-path-operations.md#pathoperationconfig)
