# utils/workflow-semantics

Workflow Semantic Validation

Validates the semantic correctness of generated GitHub Actions workflows.
This includes:

- Job dependency validation (no circular dependencies)
- Missing job reference detection
- Output reference validation
- Unreachable job detection

## Interfaces

### SemanticError

Defined in: [utils/workflow-semantics.ts:16](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L16)

#### Properties

##### code

```ts
code: string
```

Defined in: [utils/workflow-semantics.ts:18](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L18)

##### location?

```ts
optional location: string;
```

Defined in: [utils/workflow-semantics.ts:20](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L20)

##### message

```ts
message: string
```

Defined in: [utils/workflow-semantics.ts:19](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L19)

##### type

```ts
type: 'error'
```

Defined in: [utils/workflow-semantics.ts:17](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L17)

---

### SemanticValidationResult

Defined in: [utils/workflow-semantics.ts:30](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L30)

#### Properties

##### errors

```ts
errors: SemanticError[];
```

Defined in: [utils/workflow-semantics.ts:32](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L32)

##### valid

```ts
valid: boolean
```

Defined in: [utils/workflow-semantics.ts:31](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L31)

##### warnings

```ts
warnings: SemanticWarning[];
```

Defined in: [utils/workflow-semantics.ts:33](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L33)

---

### SemanticWarning

Defined in: [utils/workflow-semantics.ts:23](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L23)

#### Properties

##### code

```ts
code: string
```

Defined in: [utils/workflow-semantics.ts:25](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L25)

##### location?

```ts
optional location: string;
```

Defined in: [utils/workflow-semantics.ts:27](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L27)

##### message

```ts
message: string
```

Defined in: [utils/workflow-semantics.ts:26](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L26)

##### type

```ts
type: 'warning'
```

Defined in: [utils/workflow-semantics.ts:24](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L24)

## Functions

### validateJobDependencies()

```ts
function validateJobDependencies(yamlContent): SemanticValidationResult
```

Defined in: [utils/workflow-semantics.ts:259](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L259)

Validate job dependencies in a workflow.

Checks for:

1. Circular dependencies between jobs
2. Missing job references in needs arrays
3. Invalid output references
4. Unreachable jobs (warning)

#### Parameters

##### yamlContent

`string`

The workflow YAML content as a string

#### Returns

[`SemanticValidationResult`](#semanticvalidationresult)

Validation result with errors and warnings

#### Example

```typescript
const result = validateJobDependencies(workflowYaml)
if (!result.valid) {
  console.error('Validation errors:', result.errors)
}
```

---

### validateWorkflowSemantics()

```ts
function validateWorkflowSemantics(yamlContent): SemanticValidationResult
```

Defined in: [utils/workflow-semantics.ts:295](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/workflow-semantics.ts#L295)

Validate a complete workflow for semantic correctness.

This is the main entry point for workflow validation. It combines
job dependency validation with other semantic checks.

#### Parameters

##### yamlContent

`string`

The workflow YAML content as a string

#### Returns

[`SemanticValidationResult`](#semanticvalidationresult)

Validation result with errors and warnings
