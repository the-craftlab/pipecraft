# templates/actions/manage-branch.yml.tpl

Manage Branch Action Template

Generates a composite action for branch operations including fast-forward merges,
branch creation, and deletion. Core utility for trunk-based development workflows.

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [templates/actions/manage-branch.yml.tpl.ts:145](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/actions/manage-branch.yml.tpl.ts#L145)

Generator entry point for manage-branch composite action.

#### Parameters

##### ctx

`PinionContext` & `object`

Pinion generator context

#### Returns

`Promise`\<`any`\>

Updated context after file generation
