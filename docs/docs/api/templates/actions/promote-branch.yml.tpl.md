# templates/actions/promote-branch.yml.tpl

Promote Branch Action Template

Generates a composite action that promotes code from one branch to another via
temporary branch and pull request. Handles auto-merge and cleanup for trunk flow.

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [templates/actions/promote-branch.yml.tpl.ts:361](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/actions/promote-branch.yml.tpl.ts#L361)

Generator entry point for promote-branch composite action.

#### Parameters

##### ctx

`PinionContext` & `object`

Pinion generator context

#### Returns

`Promise`\<`any`\>

Updated context after file generation
