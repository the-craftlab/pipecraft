# utils/action-reference

Action Reference Utilities

Helper functions for generating action references in workflows based on
the configured action source mode (embedded, marketplace, or repository).

## Functions

### getActionOutputDir()

```ts
function getActionOutputDir(config): string
```

Defined in: [utils/action-reference.ts:76](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/action-reference.ts#L76)

Get the output directory for action files during generation.

#### Parameters

##### config

`Partial`\<[`PipecraftConfig`](../types.md#pipecraftconfig)\>

PipeCraft configuration

#### Returns

`string`

Directory path where actions should be generated

#### Example

```typescript
getActionOutputDir({ actionSourceMode: 'local' })
// Returns: '.github/actions'

getActionOutputDir({ actionSourceMode: 'source' })
// Returns: 'actions'
```

---

### getActionReference()

```ts
function getActionReference(actionName, config): string
```

Defined in: [utils/action-reference.ts:37](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/action-reference.ts#L37)

Generate the action reference path based on configuration.

#### Parameters

##### actionName

`string`

Name of the action (e.g., 'detect-changes', 'create-tag')

##### config

`Partial`\<[`PipecraftConfig`](../types.md#pipecraftconfig)\>

PipeCraft configuration

#### Returns

`string`

The action reference string to use in workflows

#### Example

```typescript
// Embedded mode (default)
getActionReference('detect-changes', { actionSourceMode: 'local' })
// Returns: './.github/actions/detect-changes'

// Marketplace mode
getActionReference('detect-changes', {
  actionSourceMode: 'remote',
  actionVersion: 'v1.2.3'
})
// Returns: 'the-craftlab/pipecraft/actions/detect-changes@v1.2.3'

// Repository mode (PipeCraft's own CI)
getActionReference('detect-changes', { actionSourceMode: 'source' })
// Returns: './actions/detect-changes'
```

---

### getActionSourceDescription()

```ts
function getActionSourceDescription(config): string
```

Defined in: [utils/action-reference.ts:119](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/action-reference.ts#L119)

Get human-readable description of the action source mode.

#### Parameters

##### config

`Partial`\<[`PipecraftConfig`](../types.md#pipecraftconfig)\>

PipeCraft configuration

#### Returns

`string`

Description string for logging/display

---

### shouldGenerateActions()

```ts
function shouldGenerateActions(config): boolean
```

Defined in: [utils/action-reference.ts:108](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/action-reference.ts#L108)

Check if actions should be generated locally.

#### Parameters

##### config

`Partial`\<[`PipecraftConfig`](../types.md#pipecraftconfig)\>

PipeCraft configuration

#### Returns

`boolean`

True if actions should be generated, false if using marketplace

#### Example

```typescript
shouldGenerateActions({ actionSourceMode: 'local' }) // true
shouldGenerateActions({ actionSourceMode: 'remote' }) // false
shouldGenerateActions({ actionSourceMode: 'source' }) // true
```
