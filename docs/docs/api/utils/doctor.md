# utils/doctor

Pipecraft Doctor - Diagnostic Health Check

Performs comprehensive health checks on a Pipecraft setup:

- Configuration validation
- GitHub workflow permissions
- Branch existence on remote
- Generated file verification
- Workflow semantic validation
- Domain path validation

## Interfaces

### CheckCategory

Defined in: [utils/doctor.ts:74](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L74)

#### Properties

##### name

```ts
name: string
```

Defined in: [utils/doctor.ts:75](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L75)

##### results

```ts
results: CheckResult[];
```

Defined in: [utils/doctor.ts:76](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L76)

---

### CheckResult

Defined in: [utils/doctor.ts:65](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L65)

#### Properties

##### fix?

```ts
optional fix: object;
```

Defined in: [utils/doctor.ts:68](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L68)

###### command?

```ts
optional command: string;
```

###### description

```ts
description: string
```

##### message

```ts
message: string
```

Defined in: [utils/doctor.ts:67](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L67)

##### status

```ts
status: CheckStatus
```

Defined in: [utils/doctor.ts:66](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L66)

---

### DoctorResult

Defined in: [utils/doctor.ts:79](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L79)

#### Properties

##### categories

```ts
categories: CheckCategory[];
```

Defined in: [utils/doctor.ts:80](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L80)

##### errorCount

```ts
errorCount: number
```

Defined in: [utils/doctor.ts:81](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L81)

##### warningCount

```ts
warningCount: number
```

Defined in: [utils/doctor.ts:82](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L82)

## Type Aliases

### CheckStatus

```ts
type CheckStatus = 'success' | 'error' | 'warning'
```

Defined in: [utils/doctor.ts:63](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L63)

## Functions

### checkBranches()

```ts
function checkBranches(): CheckCategory
```

Defined in: [utils/doctor.ts:347](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L347)

Check 3: Branches exist on remote

#### Returns

[`CheckCategory`](#checkcategory)

---

### checkConfiguration()

```ts
function checkConfiguration(): CheckCategory
```

Defined in: [utils/doctor.ts:191](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L191)

Check 1: Configuration validation

#### Returns

[`CheckCategory`](#checkcategory)

---

### checkDomainPaths()

```ts
function checkDomainPaths(): Promise<CheckCategory>
```

Defined in: [utils/doctor.ts:629](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L629)

Check 6: Domain paths match files

#### Returns

`Promise`\<[`CheckCategory`](#checkcategory)\>

---

### checkGeneratedFiles()

```ts
function checkGeneratedFiles(): CheckCategory
```

Defined in: [utils/doctor.ts:419](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L419)

Check 4: Required actions exist

#### Returns

[`CheckCategory`](#checkcategory)

---

### checkGitHubPermissions()

```ts
function checkGitHubPermissions(): Promise<CheckCategory>
```

Defined in: [utils/doctor.ts:237](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L237)

Check 2: GitHub workflow permissions

#### Returns

`Promise`\<[`CheckCategory`](#checkcategory)\>

---

### checkWorkflowSemantics()

```ts
function checkWorkflowSemantics(): CheckCategory
```

Defined in: [utils/doctor.ts:557](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L557)

Check 5: Workflow semantic validation

#### Returns

[`CheckCategory`](#checkcategory)

---

### formatDoctorOutput()

```ts
function formatDoctorOutput(result): string
```

Defined in: [utils/doctor.ts:121](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L121)

#### Parameters

##### result

[`DoctorResult`](#doctorresult)

#### Returns

`string`

---

### runDoctor()

```ts
function runDoctor(): Promise<DoctorResult>
```

Defined in: [utils/doctor.ts:701](https://github.com/the-craftlab/pipecraft/blob/main/src/utils/doctor.ts#L701)

Run all diagnostic checks and return the results.

#### Returns

`Promise`\<[`DoctorResult`](#doctorresult)\>
