# templates/actions/detect-changes.yml.tpl

Detect Changes Action Template

Generates a REUSABLE GitHub composite action that detects which domains have changed
using path-based change detection with dorny/paths-filter.

## Purpose

This action is **configuration-driven** and accepts domain definitions as YAML input,
making it truly reusable across any project without regeneration.
It uses path filters to detect which domains changed based on file glob patterns.

## Key Design Principle

**Domains are passed as input, not hardcoded in the action.**
This allows the same action to work with any domain configuration without regeneration.

## Generated Action Location

`actions/detect-changes/action.yml`

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [templates/actions/detect-changes.yml.tpl.ts:210](https://github.com/the-craftlab/pipecraft/blob/main/src/templates/actions/detect-changes.yml.tpl.ts#L210)

Generator entry point for detect-changes composite action.

Generates the `actions/detect-changes/action.yml` file with configuration-driven
change detection logic. This action accepts domain configuration as input at runtime,
making it truly reusable without regeneration.

#### Parameters

##### ctx

`PinionContext` & `object`

Pinion generator context

#### Returns

`Promise`\<`any`\>

Updated context after file generation
