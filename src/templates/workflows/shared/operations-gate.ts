import { Document, Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml'
import { logger } from '../../../utils/logger.js'

const GATE_COMMENT = `
=============================================================================
 GATE (⚠️  Managed by Pipecraft - customizable needs and if)
=============================================================================
 Gate job that ensures prior jobs succeed before allowing tag/promote/release.
 Uses pattern: allow only SUCCESS or SKIPPED results (failures block progression).

 ⚡ CUSTOMIZATION: Add your custom test/build jobs to 'needs' array and update
 the 'if' condition to include them. These fields are preserved on regeneration.
 Example: needs: [changes, version, test-myapp, build-myapp]
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
function buildGateSteps(): YAMLSeq {
  const failStep = new YAMLMap()
  failStep.set('name', new Scalar('Fail if any prerequisite job failed'))
  const failIf = new Scalar(GATE_FAIL_IF)
  failIf.type = Scalar.QUOTE_DOUBLE
  failStep.set('if', failIf)
  failStep.set('run', new Scalar(GATE_FAIL_RUN))

  const passStep = new YAMLMap()
  passStep.set('name', new Scalar('Gate passed'))
  passStep.set('run', new Scalar(DEFAULT_GATE_STEP_RUN))

  const stepsSeq = new YAMLSeq()
  stepsSeq.items = [failStep, passStep]
  return stepsSeq
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

  // Only set needs/if when creating a new gate job - existing values are preserved here
  // (P0.4 re-asserts the correctness-critical if/steps on existing gates while keeping
  // user-added needs). This allows users to customize their gate prerequisites.
  if (!gateExisted) {
    ;(gateMap as YAMLMap).set('needs', buildNeedsSequence(prerequisites))
    ;(gateMap as YAMLMap).set('if', buildGateIf())
  }
}
