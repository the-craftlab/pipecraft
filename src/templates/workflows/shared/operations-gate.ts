import { Document, Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml'
import { logger } from '../../../utils/logger.js'

export const GATE_COMMENT = `
=============================================================================
 GATE (Managed by Pipecraft)
=============================================================================
 Ensures prerequisite jobs pass before tag/promote/release run.

 ✅ CUSTOMIZABLE (preserved on regeneration): add your test/build jobs to 'needs'.
    The gate checks every job in 'needs' automatically (via needs.*.result), so you
    do NOT edit the 'if' or the steps.
    Example: needs: [changes, version, test-myapp, build-myapp]

 🔒 MANAGED (re-asserted on every 'pipecraft generate'): 'if: always()' and the
    fail-on-failure step. This keeps the gate from being silently disabled. Run
    'pipecraft generate --force' to reset the whole gate to template defaults.
` as const

const DEFAULT_GATE_STEP_RUN =
  'echo "All prerequisite jobs succeeded or were skipped - gate allows progression"'

function toKeyString(key: any): string {
  if (key instanceof Scalar) {
    return typeof key.value === 'string' ? key.value : String(key.value)
  }

  return String(key)
}

function buildNeedsSequence(jobNames: string[]): YAMLSeq {
  const seq = new YAMLSeq()
  seq.items = jobNames.map(name => new Scalar(name))
  return seq
}

/**
 * The gate always runs. An `if` that can evaluate false would make the gate *skip* on a
 * prerequisite failure, and GitHub treats a skipped required check as passed — so a
 * conditional gate cannot actually block. Instead the gate runs unconditionally and
 * fails in-step (see buildGateSteps).
 */
function buildGateIf(): Scalar {
  const scalar = new Scalar('${{ always() }}')
  scalar.type = Scalar.QUOTE_DOUBLE
  return scalar
}

const GATE_FAIL_IF =
  "${{ contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled') }}"
const GATE_FAIL_RUN = 'echo "::error::A prerequisite job failed - blocking progression" && exit 1'

/**
 * Build the gate's steps: first a step that FAILS the job when any prerequisite failed or
 * was cancelled (skipped/path-filtered prerequisites are allowed), then a success marker.
 * `needs.*.result` automatically includes any jobs the user added to `needs`, so custom
 * test jobs are covered without editing this step.
 */
function buildFailStep(): YAMLMap {
  const failStep = new YAMLMap()
  failStep.set('name', new Scalar('Fail if any prerequisite job failed'))
  const failIf = new Scalar(GATE_FAIL_IF)
  failIf.type = Scalar.QUOTE_DOUBLE
  failStep.set('if', failIf)
  failStep.set('run', new Scalar(GATE_FAIL_RUN))
  return failStep
}

function buildPassStep(): YAMLMap {
  const passStep = new YAMLMap()
  passStep.set('name', new Scalar('Gate passed'))
  passStep.set('run', new Scalar(DEFAULT_GATE_STEP_RUN))
  return passStep
}

function buildGateSteps(): YAMLSeq {
  const stepsSeq = new YAMLSeq()
  stepsSeq.items = [buildFailStep(), buildPassStep()]
  return stepsSeq
}

/** True if the gate already has the managed fail-on-failure step. */
function gateHasFailStep(steps: YAMLSeq): boolean {
  return (steps.items as any[]).some(item => {
    if (!(item instanceof YAMLMap)) return false
    const ifVal = item.get('if')
    const ifStr = ifVal instanceof Scalar ? String(ifVal.value) : String(ifVal ?? '')
    return ifStr.includes('needs.*.result')
  })
}

/**
 * Ensure the gate carries the managed fail-on-failure step, preserving any other
 * (user) steps. Returns true if a change was made.
 */
function ensureFailStep(gateMap: YAMLMap): boolean {
  const steps = gateMap.get('steps')
  if (!(steps instanceof YAMLSeq)) {
    gateMap.set('steps', buildGateSteps())
    return true
  }
  if (!gateHasFailStep(steps)) {
    ;(steps.items as any[]).unshift(buildFailStep())
    return true
  }
  return false
}

function ensureDefaultRunsAndSteps(gateMap: YAMLMap) {
  if (!gateMap.has('runs-on')) {
    gateMap.set('runs-on', new Scalar('ubuntu-latest'))
  }

  if (!gateMap.has('steps')) {
    gateMap.set('steps', buildGateSteps())
  }
}

function dedupePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value)
      result.push(value)
    }
  }

  return result
}

export function ensureGateJob(doc: Document.Parsed) {
  const root = doc.contents

  if (!(root instanceof YAMLMap)) {
    logger.warn('⚠️  Unable to update gate job - root YAML node is not a map')
    return
  }

  let jobsNode = root.get('jobs') as YAMLMap | undefined

  if (!(jobsNode instanceof YAMLMap)) {
    jobsNode = new YAMLMap()
    const jobsPair = new Pair(new Scalar('jobs'), jobsNode)
    ;(root.items as any[]).push(jobsPair)
  }

  const items = jobsNode.items as Pair[]
  const gateIndex = items.findIndex(pair => toKeyString(pair.key) === 'gate')
  const tagIndex = items.findIndex(pair => toKeyString(pair.key) === 'tag')

  let gatePair: Pair
  const gateExisted = gateIndex !== -1

  if (gateExisted) {
    gatePair = items[gateIndex]
  } else {
    const insertionIndex = tagIndex !== -1 ? tagIndex : items.length
    const gateKey = new Scalar('gate')
    ;(gateKey as any).spaceBefore = true
    ;(gateKey as any).commentBefore = GATE_COMMENT.trimEnd()
    gatePair = new Pair(gateKey, new YAMLMap())
    items.splice(insertionIndex, 0, gatePair)
  }

  const currentIndex = items.indexOf(gatePair)
  const priorJobs = items.slice(0, currentIndex)

  // Filter out disabled jobs (those with if: false or if: ${{ false }})
  const enabledPriorJobs = priorJobs.filter(pair => {
    const jobMap = pair.value
    if (!(jobMap instanceof YAMLMap)) return false

    const ifCondition = jobMap.get('if')
    if (!ifCondition) return true // No condition means enabled

    // Check if explicitly disabled
    const ifValue =
      ifCondition instanceof Scalar ? String(ifCondition.value).trim() : String(ifCondition).trim()
    return ifValue !== 'false' && ifValue !== '${{ false }}'
  })

  const priorJobKeys = enabledPriorJobs.map(pair => toKeyString(pair.key))
  const prerequisites = dedupePreserveOrder(priorJobKeys)

  let gateMap = gatePair.value
  if (!(gateMap instanceof YAMLMap)) {
    gateMap = new YAMLMap()
    gatePair.value = gateMap
  }

  // Ensure the gate key has the comment (for existing gates without it)
  if (!(gatePair.key as any).commentBefore) {
    ;(gatePair.key as any).commentBefore = GATE_COMMENT.trimEnd()
  }

  if (!gateExisted) {
    ensureDefaultRunsAndSteps(gateMap as YAMLMap)
  }

  // `needs` and `runs-on` are user-customizable: only seed them when creating a new gate,
  // then preserve them across regeneration.
  if (!gateExisted) {
    ;(gateMap as YAMLMap).set('needs', buildNeedsSequence(prerequisites))
  }

  // The gate's `if: always()` and fail-on-failure step are correctness-critical and
  // MANAGED: re-assert them on every regeneration so the gate can't be silently
  // disabled. (Use `pipecraft generate --force` for a full reset.)
  const gm = gateMap as YAMLMap
  const desiredIf = '${{ always() }}'
  const previousIf = gm.get('if')
  const previousIfStr =
    previousIf instanceof Scalar ? String(previousIf.value) : String(previousIf ?? '')

  let healed = false
  if (previousIfStr !== desiredIf) {
    gm.set('if', buildGateIf())
    if (gateExisted) healed = true
  }
  if (ensureFailStep(gm) && gateExisted) {
    healed = true
  }

  if (healed) {
    logger.info(
      '📋 Re-asserted managed gate wiring (if / fail-on-failure step) that had drifted; ' +
        "your gate 'needs' and 'runs-on' were preserved. " +
        "Run 'pipecraft generate --force' to reset the gate to template defaults."
    )
  }
}
