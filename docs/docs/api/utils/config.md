# utils/config

Configuration Loading and Validation Utilities

This module provides functions to load and validate PipeCraft configuration files.
It uses cosmiconfig to search for configuration in multiple locations:

- .pipecraftrc (YAML or JSON, recommended)
- .pipecraftrc.json
- .pipecraftrc.yaml
- .pipecraftrc.yml
- .pipecraftrc.js
- pipecraft.config.js
- package.json (pipecraft key)

The configuration is validated to ensure all required fields are present
and have valid values before being used to generate workflows.

## Variables

### RESERVED_JOB_NAMES

```ts
const RESERVED_JOB_NAMES: readonly ['version', 'changes', 'gate', 'tag', 'promote', 'release']
```

Defined in: [utils/config.ts:27](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/config.ts#L27)

Reserved job names that cannot be used as domain names.
These are managed by Pipecraft and would conflict with generated workflow jobs.

## Functions

### loadConfig()

```ts
function loadConfig(configPath?): any
```

Defined in: [utils/config.ts:63](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/config.ts#L63)

Load PipeCraft configuration from filesystem.

Uses cosmiconfig to search for configuration files in standard locations.
If no path is provided, searches the current directory and ancestors for
configuration files in this order:

1. .pipecraftrc (YAML or JSON, recommended)
2. .pipecraftrc.json
3. .pipecraftrc.yaml
4. .pipecraftrc.yml
5. .pipecraftrc.js
6. pipecraft.config.js
7. package.json (pipecraft key)

#### Parameters

##### configPath?

`string`

Optional explicit path to configuration file

#### Returns

`any`

Parsed configuration object

#### Throws

If no configuration file is found

#### Example

```typescript
// Search for config in current directory and ancestors
const config = loadConfig()

// Load from explicit path
const config = loadConfig('./my-config.json')
```

---

### validateConfig()

```ts
function validateConfig(config): boolean
```

Defined in: [utils/config.ts:113](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/config.ts#L113)

Validate PipeCraft configuration structure and values.

Performs comprehensive validation including:

- Presence of all required fields
- Valid enum values (ciProvider, mergeStrategy)
- Branch flow structure (minimum 2 branches)
- Domain configuration (paths, testable, deployable)

Also sets default values for optional domain properties:

- testable defaults to true
- deployable defaults to true

#### Parameters

##### config

`any`

Configuration object to validate (untyped to allow validation)

#### Returns

`boolean`

true if validation passes

#### Throws

If validation fails with detailed error message

#### Example

```typescript
const config = loadConfig()
validateConfig(config) // Throws if invalid
// Safe to use config as PipecraftConfig after this point
```
