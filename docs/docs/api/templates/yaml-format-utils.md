# templates/yaml-format-utils

## Functions

### formatIfConditions()

```ts
function formatIfConditions(yamlContent, minLength): string
```

Defined in: [templates/yaml-format-utils.ts:24](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/templates/yaml-format-utils.ts#L24)

Formats long GitHub Actions conditional expressions for better readability.
Takes a YAML string and formats multi-line `if:` conditions with proper indentation.

#### Parameters

##### yamlContent

`string`

The YAML content to format

##### minLength

`number` = `80`

Minimum length threshold for formatting (default: 80 characters)

#### Returns

`string`

Formatted YAML content

#### Example

```ts
Input:
  if: ${{ always() && github.event_name != 'pull_request' && needs.test.result == 'success' }}

Output:
  if: ${{
      always() &&
      github.event_name != 'pull_request' &&
      needs.test.result == 'success'
    }}
```
