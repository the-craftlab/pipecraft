# utils/messaging

Persona-Aware Messaging System for PipeCraft

This module provides a messaging system that adapts to different user personas
and provides clear, actionable feedback during GitHub setup.

## Personas

### Startup Developer ("Just Make It Work")

- Needs simple language and clear actions
- Wants to know "what this means for me"
- Prefers step-by-step guidance

### Team Lead ("Safe and Consistent")

- Needs rationale for recommendations
- Wants to understand what's being changed
- Balances detail with clarity

### Platform Engineer ("I Know What I'm Doing")

- Wants concise status reports
- Prefers technical accuracy
- Minimal hand-holding

## Message Severity Levels

- **🔴 Critical**: Setup will fail without action
- **🟡 Warning**: Recommended changes for optimal experience
- **🔵 Info**: Status updates and explanations
- **🟢 Success**: Completed actions and confirmations

## Interfaces

### MessageContext

Defined in: [utils/messaging.ts:38](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L38)

#### Properties

##### autoApply

```ts
autoApply: boolean
```

Defined in: [utils/messaging.ts:41](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L41)

##### persona

```ts
persona: UserPersona
```

Defined in: [utils/messaging.ts:39](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L39)

##### verbose

```ts
verbose: boolean
```

Defined in: [utils/messaging.ts:40](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L40)

---

### SetupSummary

Defined in: [utils/messaging.ts:54](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L54)

#### Properties

##### autoPromote

```ts
autoPromote: StatusItem[];
```

Defined in: [utils/messaging.ts:59](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L59)

##### errors

```ts
errors: string[];
```

Defined in: [utils/messaging.ts:62](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L62)

##### nextSteps

```ts
nextSteps: string[];
```

Defined in: [utils/messaging.ts:60](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L60)

##### overallStatus

```ts
overallStatus: 'error' | 'ready' | 'needs-setup' | 'partial'
```

Defined in: [utils/messaging.ts:56](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L56)

##### permissions

```ts
permissions: StatusItem[];
```

Defined in: [utils/messaging.ts:57](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L57)

##### repository

```ts
repository: string
```

Defined in: [utils/messaging.ts:55](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L55)

##### settings

```ts
settings: StatusItem[];
```

Defined in: [utils/messaging.ts:58](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L58)

##### warnings

```ts
warnings: string[];
```

Defined in: [utils/messaging.ts:61](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L61)

---

### StatusItem

Defined in: [utils/messaging.ts:44](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L44)

#### Properties

##### action?

```ts
optional action: string;
```

Defined in: [utils/messaging.ts:51](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L51)

##### category

```ts
category: string
```

Defined in: [utils/messaging.ts:45](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L45)

##### current

```ts
current: string
```

Defined in: [utils/messaging.ts:47](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L47)

##### explanation?

```ts
optional explanation: string;
```

Defined in: [utils/messaging.ts:50](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L50)

##### name

```ts
name: string
```

Defined in: [utils/messaging.ts:46](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L46)

##### recommended

```ts
recommended: string | null
```

Defined in: [utils/messaging.ts:48](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L48)

##### status

```ts
status: 'error' | 'correct' | 'needs-change' | 'missing'
```

Defined in: [utils/messaging.ts:49](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L49)

## Type Aliases

### MessageSeverity

```ts
type MessageSeverity = 'critical' | 'warning' | 'info' | 'success'
```

Defined in: [utils/messaging.ts:36](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L36)

---

### UserPersona

```ts
type UserPersona = 'startup' | 'team-lead' | 'platform-engineer'
```

Defined in: [utils/messaging.ts:34](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L34)

## Functions

### createSetupSummary()

```ts
function createSetupSummary(repository, permissions, settings, autoPromote, context): SetupSummary
```

Defined in: [utils/messaging.ts:193](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L193)

Create setup summary

#### Parameters

##### repository

`string`

##### permissions

[`StatusItem`](#statusitem)[]

##### settings

[`StatusItem`](#statusitem)[]

##### autoPromote

[`StatusItem`](#statusitem)[]

##### context

[`MessageContext`](#messagecontext)

#### Returns

[`SetupSummary`](#setupsummary)

---

### detectPersona()

```ts
function detectPersona(context): UserPersona
```

Defined in: [utils/messaging.ts:68](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L68)

Detect user persona based on context clues

#### Parameters

##### context

###### hasConfig

`boolean`

###### hasWorkflows

`boolean`

###### isFirstRun

`boolean`

###### verbose

`boolean`

#### Returns

[`UserPersona`](#userpersona)

---

### formatMessage()

```ts
function formatMessage(message, severity, context): string
```

Defined in: [utils/messaging.ts:91](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L91)

Format message based on persona and severity

#### Parameters

##### message

`string`

##### severity

[`MessageSeverity`](#messageseverity)

##### context

[`MessageContext`](#messagecontext)

#### Returns

`string`

---

### formatNextSteps()

```ts
function formatNextSteps(steps, context): string
```

Defined in: [utils/messaging.ts:170](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L170)

Format next steps based on persona

#### Parameters

##### steps

`string`[]

##### context

[`MessageContext`](#messagecontext)

#### Returns

`string`

---

### formatQuickSuccess()

```ts
function formatQuickSuccess(repository, context): string
```

Defined in: [utils/messaging.ts:309](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L309)

Simple success message for when everything is already configured

#### Parameters

##### repository

`string`

##### context

[`MessageContext`](#messagecontext)

#### Returns

`string`

---

### formatSetupSummary()

```ts
function formatSetupSummary(summary, context): string
```

Defined in: [utils/messaging.ts:248](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L248)

Format the complete setup summary

#### Parameters

##### summary

[`SetupSummary`](#setupsummary)

##### context

[`MessageContext`](#messagecontext)

#### Returns

`string`

---

### formatStatusTable()

```ts
function formatStatusTable(items, context): string
```

Defined in: [utils/messaging.ts:121](https://github.com/the-craftlab/pipecraft/blob/b7312a6766bca4e83d219560237c5ba10f0b57b8/src/utils/messaging.ts#L121)

Create a clean status table

#### Parameters

##### items

[`StatusItem`](#statusitem)[]

##### context

[`MessageContext`](#messagecontext)

#### Returns

`string`
