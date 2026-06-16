# templates/release-it.cjs.tpl

Release-It Configuration Template

Generates a release-it configuration file (.release-it.cjs) that integrates
with PipeCraft's versioning system and conventional commits workflow.

This template creates a release-it configuration that:

- Uses conventional commits for version bumping
- Integrates with GitHub releases
- Supports custom version bump rules
- Works with PipeCraft's trunk-based development flow

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [templates/release-it.cjs.tpl.ts:155](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/release-it.cjs.tpl.ts#L155)

Release-It configuration generator

Generates a release-it configuration file that integrates with PipeCraft's
versioning system and conventional commits workflow.

#### Parameters

##### ctx

`PinionContext`

Pinion generator context

#### Returns

`Promise`\<`any`\>

Updated context after file generation

#### Example

```typescript
// Called by PipeCraft when generating workflows
await generate({
  cwd: '/path/to/project',
  semver: {
    bumpRules: {
      feat: 'minor',
      fix: 'patch',
      breaking: 'major'
    }
  }
})
```
