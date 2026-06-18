# templates/actions/create-pr.yml.tpl

Create Pull Request Action Template

Generates a composite action that creates pull requests between branches, used for
automating branch promotion in trunk-based development workflows.

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [templates/actions/create-pr.yml.tpl.ts:160](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/actions/create-pr.yml.tpl.ts#L160)

Generator entry point for create-pr composite action.

#### Parameters

##### ctx

`PinionContext` & `object`

Pinion generator context

#### Returns

`Promise`\<`any`\>

Updated context after file generation
