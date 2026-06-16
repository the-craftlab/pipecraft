# templates/workflows/shared/managed-workflow

## Interfaces

### ManagedWorkflowContext

Defined in: [templates/workflows/shared/managed-workflow.ts:22](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/managed-workflow.ts#L22)

#### Extends

- `Omit`\<`PinionContext`, `"pinion"`\>

#### Properties

##### pinion?

```ts
optional pinion: Configuration & object;
```

Defined in: [templates/workflows/shared/managed-workflow.ts:23](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/managed-workflow.ts#L23)

###### Type Declaration

###### force?

```ts
optional force: boolean;
```

## Variables

### MANAGED_WORKFLOW_STRINGIFY_OPTIONS

```ts
const MANAGED_WORKFLOW_STRINGIFY_OPTIONS: object
```

Defined in: [templates/workflows/shared/managed-workflow.ts:28](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/managed-workflow.ts#L28)

#### Type Declaration

##### defaultKeyType

```ts
defaultKeyType: 'PLAIN'
```

##### defaultStringType

```ts
defaultStringType: 'PLAIN'
```

##### indent

```ts
indent: number = 2
```

##### lineWidth

```ts
lineWidth: number = 0
```

##### minContentWidth

```ts
minContentWidth: number = 0
```

## Functions

### applyManagedWorkflowOperations()

```ts
function applyManagedWorkflowOperations(doc, operations, _ctx): void
```

Defined in: [templates/workflows/shared/managed-workflow.ts:71](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/managed-workflow.ts#L71)

#### Parameters

##### doc

`Parsed`

##### operations

[`PathOperationConfig`](../../../utils/ast-path-operations.md#pathoperationconfig)[]

##### \_ctx

[`ManagedWorkflowContext`](#managedworkflowcontext)

#### Returns

`void`

---

### createManagedWorkflowDocument()

```ts
function createManagedWorkflowDocument(headerComment, operations, _ctx): Parsed
```

Defined in: [templates/workflows/shared/managed-workflow.ts:50](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/managed-workflow.ts#L50)

#### Parameters

##### headerComment

`string`

##### operations

[`PathOperationConfig`](../../../utils/ast-path-operations.md#pathoperationconfig)[]

##### \_ctx

[`ManagedWorkflowContext`](#managedworkflowcontext)

#### Returns

`Parsed`

---

### stringifyManagedWorkflow()

```ts
function stringifyManagedWorkflow(doc, options): string
```

Defined in: [templates/workflows/shared/managed-workflow.ts:79](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/managed-workflow.ts#L79)

#### Parameters

##### doc

`Parsed`

##### options

###### defaultKeyType

`"PLAIN"` = `...`

###### defaultStringType

`"PLAIN"` = `...`

###### indent

`number` = `2`

###### lineWidth

`number` = `0`

###### minContentWidth

`number` = `0`

#### Returns

`string`

---

### updateManagedWorkflowDocument()

```ts
function updateManagedWorkflowDocument(existingContent, operations, _ctx): Parsed
```

Defined in: [templates/workflows/shared/managed-workflow.ts:61](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/shared/managed-workflow.ts#L61)

#### Parameters

##### existingContent

`string`

##### operations

[`PathOperationConfig`](../../../utils/ast-path-operations.md#pathoperationconfig)[]

##### \_ctx

[`ManagedWorkflowContext`](#managedworkflowcontext)

#### Returns

`Parsed`
