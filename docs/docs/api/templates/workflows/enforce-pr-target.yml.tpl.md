# templates/workflows/enforce-pr-target.yml.tpl

Enforce PR Target Branch Workflow Template

Generates a GitHub Actions workflow that enforces pull requests target the correct
initial branch (typically 'develop') instead of the final branch (typically 'main').
This prevents accidental direct commits to production branches.

The workflow:

- Triggers on PR events (opened, edited, synchronize, reopened)
- Checks if the PR targets the final branch (main)
- Fails with helpful error message if targeting wrong branch
- Succeeds with confirmation if targeting correct branch

## Example

```typescript
import { generate } from './templates/workflows/enforce-pr-target.yml.tpl.js'

await generate({
  cwd: '/path/to/project',
  config: {
    initialBranch: 'develop',
    finalBranch: 'main'
  }
})
```

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [templates/workflows/enforce-pr-target.yml.tpl.ts:54](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/enforce-pr-target.yml.tpl.ts#L54)

Generates the enforce-pr-target.yml workflow file.

Creates a workflow that enforces PRs target the initial branch (develop)
instead of the final branch (main) to prevent direct commits to production.

#### Parameters

##### ctx

`PinionContext`

Pinion context with configuration

#### Returns

`Promise`\<`any`\>

Updated context after file generation

#### Throws

If the workflow file cannot be written

#### Example

```typescript
// Generate with default config
await generate({
  cwd: '/path/to/project',
  config: { initialBranch: 'develop', finalBranch: 'main' }
})

// Creates: .github/workflows/enforce-pr-target.yml
```
