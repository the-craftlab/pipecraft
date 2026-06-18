# utils/skill-installer

## Interfaces

### InstallOptions

Defined in: [utils/skill-installer.ts:158](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L158)

#### Properties

##### cwd?

```ts
optional cwd: string;
```

Defined in: [utils/skill-installer.ts:163](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L163)

##### force?

```ts
optional force: boolean;
```

Defined in: [utils/skill-installer.ts:162](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L162)

##### global?

```ts
optional global: boolean;
```

Defined in: [utils/skill-installer.ts:159](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L159)

##### local?

```ts
optional local: boolean;
```

Defined in: [utils/skill-installer.ts:160](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L160)

##### targets?

```ts
optional targets: string[];
```

Defined in: [utils/skill-installer.ts:161](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L161)

---

### InstallResult

Defined in: [utils/skill-installer.ts:23](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L23)

#### Properties

##### error?

```ts
optional error: string;
```

Defined in: [utils/skill-installer.ts:27](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L27)

##### path

```ts
path: string
```

Defined in: [utils/skill-installer.ts:25](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L25)

##### reason?

```ts
optional reason: string;
```

Defined in: [utils/skill-installer.ts:29](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L29)

##### skipped?

```ts
optional skipped: boolean;
```

Defined in: [utils/skill-installer.ts:28](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L28)

##### success

```ts
success: boolean
```

Defined in: [utils/skill-installer.ts:26](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L26)

##### target

```ts
target: string
```

Defined in: [utils/skill-installer.ts:24](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L24)

---

### SkillTarget

Defined in: [utils/skill-installer.ts:15](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L15)

#### Properties

##### configFile?

```ts
optional configFile: string;
```

Defined in: [utils/skill-installer.ts:20](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L20)

##### displayName

```ts
displayName: string
```

Defined in: [utils/skill-installer.ts:17](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L17)

##### globalPath

```ts
globalPath: string
```

Defined in: [utils/skill-installer.ts:18](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L18)

##### localPath

```ts
localPath: string
```

Defined in: [utils/skill-installer.ts:19](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L19)

##### name

```ts
name: string
```

Defined in: [utils/skill-installer.ts:16](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L16)

## Variables

### SKILL_TARGETS

```ts
const SKILL_TARGETS: SkillTarget[]
```

Defined in: [utils/skill-installer.ts:35](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L35)

Supported AI coding assistant targets

## Functions

### installSkills()

```ts
function installSkills(options): InstallResult[]
```

Defined in: [utils/skill-installer.ts:169](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L169)

Install Pipecraft skills for AI coding assistants

#### Parameters

##### options

[`InstallOptions`](#installoptions) = `{}`

#### Returns

[`InstallResult`](#installresult)[]

---

### listSkillTargets()

```ts
function listSkillTargets(): object[]
```

Defined in: [utils/skill-installer.ts:226](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L226)

List available skill targets and their status

#### Returns

`object`[]

---

### uninstallSkills()

```ts
function uninstallSkills(options): InstallResult[]
```

Defined in: [utils/skill-installer.ts:245](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/skill-installer.ts#L245)

Uninstall skills from all targets

#### Parameters

##### options

###### cwd?

`string`

###### global?

`boolean`

###### local?

`boolean`

#### Returns

[`InstallResult`](#installresult)[]
