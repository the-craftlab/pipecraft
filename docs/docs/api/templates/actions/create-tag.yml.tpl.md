# templates/actions/create-tag.yml.tpl

Create Tag Action Template

Generates a composite action that creates and pushes git tags, and optionally creates
GitHub releases. Used after version calculation to tag the codebase with semantic versions.

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [templates/actions/create-tag.yml.tpl.ts:126](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/actions/create-tag.yml.tpl.ts#L126)

Generator entry point for create-tag composite action.

#### Parameters

##### ctx

`PinionContext` & `object`

Pinion generator context

#### Returns

`Promise`\<`any`\>

Updated context after file generation
