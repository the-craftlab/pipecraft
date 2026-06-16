# templates/actions/create-release.yml.tpl

Create Release Action Template

Generates a composite action that creates GitHub releases with auto-generated
release notes from commit history. Used on the final branch (typically main)
after successful version calculation and tagging.

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [templates/actions/create-release.yml.tpl.ts:142](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/actions/create-release.yml.tpl.ts#L142)

Generator entry point for create-release composite action.

#### Parameters

##### ctx

`PinionContext` & `object`

Pinion generator context

#### Returns

`Promise`\<`any`\>

Updated context after file generation
