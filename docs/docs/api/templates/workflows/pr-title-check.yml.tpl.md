# templates/workflows/pr-title-check.yml.tpl

PR Title Check Workflow Template

Generates a GitHub Actions workflow that validates pull request titles follow
the Conventional Commits specification. This ensures consistent commit and
PR title formatting across the project.

The workflow:

- Triggers on PR events (opened, edited, synchronize, reopened)
- Validates PR titles using conventional commit format
- Provides helpful error messages with guidance
- Uses sticky comments to show validation results

## Example

```typescript
import { generate } from './templates/workflows/pr-title-check.yml.tpl.js'

await generate({
  cwd: '/path/to/project',
  config: {
    requireConventionalCommits: true
  }
})
```

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [templates/workflows/pr-title-check.yml.tpl.ts:53](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/workflows/pr-title-check.yml.tpl.ts#L53)

Generates the pr-title-check.yml workflow file.

Creates a workflow that validates PR titles follow conventional commit format
and provides helpful feedback to contributors.

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
  config: { requireConventionalCommits: true }
})

// Creates: .github/workflows/pr-title-check.yml
```
