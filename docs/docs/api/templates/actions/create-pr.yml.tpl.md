# templates/actions/create-pr.yml.tpl

Create Pull Request Action Template

Generates a composite action that creates pull requests between branches, used for
automating branch promotion in trunk-based development workflows.

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [templates/actions/create-pr.yml.tpl.ts:160](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/actions/create-pr.yml.tpl.ts#L160)

Generator entry point for create-pr composite action.

#### Parameters

##### ctx

`PinionContext` & `object`

Pinion generator context

#### Returns

`Promise`\<`any`\>

Updated context after file generation
