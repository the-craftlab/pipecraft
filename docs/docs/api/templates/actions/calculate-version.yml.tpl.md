# templates/actions/calculate-version.yml.tpl

Calculate Version Action Template

Generates a composite action that calculates the next semantic version based on
conventional commits. Uses `release-it` to analyze commit history and determine
the appropriate version bump (major, minor, or patch).

## Purpose

Automates semantic versioning in the CI/CD pipeline by:

- Analyzing conventional commit messages since the last tag
- Determining the appropriate version bump (feat→minor, fix→patch, BREAKING→major)
- Installing and running release-it for version calculation
- Outputting the calculated version for use in subsequent jobs

## Generated Action Location

`actions/calculate-version/action.yml`

## Usage in Workflows

```yaml
jobs:
  version:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.calc.outputs.version }}
    steps:
      - uses: ./actions/calculate-version
        id: calc
        with:
          baseRef: main

  tag:
    needs: version
    steps:
      - run: echo "Next version: ${{ needs.version.outputs.version }}"
```

## Functions

### generate()

```ts
function generate(ctx): Promise<any>
```

Defined in: [templates/actions/calculate-version.yml.tpl.ts:233](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/actions/calculate-version.yml.tpl.ts#L233)

Generator entry point for calculate-version composite action.

#### Parameters

##### ctx

`PinionContext` & `object`

Pinion generator context

#### Returns

`Promise`\<`any`\>

Updated context after file generation
