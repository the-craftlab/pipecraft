# generators/workflows.tpl

Workflows Template Generator

Main orchestrator for generating complete GitHub Actions CI/CD pipeline.
This generator creates all necessary workflow files including:

- Main pipeline workflow (path-based change detection)
- Reusable composite actions (tag creation, versioning, branch management, etc.)

The generator supports both initial generation and incremental updates, preserving
user modifications to existing workflows through intelligent merging.

## Example

```typescript
import { generate } from './generators/workflows.tpl.js'

// Initial generation - creates all workflows
await generate({
  cwd: '/path/to/project',
  config: pipecraftConfig
})

// Incremental update - merges with existing pipeline
await generate({
  cwd: '/path/to/project',
  pipelinePath: '.github/workflows/pipeline.yml',
  config: pipecraftConfig
})

// Creates:
// .github/workflows/pipeline.yml         - Main pipeline
// actions/detect-changes/...     - Change detection action
// actions/calculate-version/...  - Version calculation action
// actions/create-tag/...         - Tag creation action
// actions/create-pr/...          - PR creation action
// actions/manage-branch/...      - Branch management action
// actions/promote-branch/...     - Branch promotion action
// actions/create-release/...     - Release creation action
// .release-it.cjs                        - Release-it configuration
```

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [generators/workflows.tpl.ts:137](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/generators/workflows.tpl.ts#L137)

Workflows generator main entry point.

Orchestrates the complete workflow generation process:

1. Loads existing pipeline (if specified) for merging
2. Merges configuration with defaults
3. Generates all composite actions in parallel
4. Generates the main pipeline workflow

#### Parameters

##### ctx

`PinionContext` & `object`

Extended Pinion context

#### Returns

`Promise`\<`any`\>

Updated context after workflow generation

#### Throws

If workflow files cannot be written

#### Throws

If existing pipeline cannot be parsed

#### Example

```typescript
// Initial generation with config
await generate({
  cwd: '/path/to/project',
  config: {
    ciProvider: 'github',
    branchFlow: ['develop', 'staging', 'main'],
    domains: { api: { paths: ['src/api/**'] } }
  }
})

// Update existing pipeline
await generate({
  cwd: '/path/to/project',
  pipelinePath: '.github/workflows/pipeline.yml',
  config: updatedConfig
})
```

#### Note

The generator creates 9 files:

- 1 main workflow (pipeline.yml)
- 7 composite actions (in actions/)
- 1 release-it configuration (.release-it.cjs)

All actions are generated in parallel for performance, followed by
the main pipeline which may reference the actions.
