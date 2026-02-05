import { Document, Pair, Scalar, YAMLMap, YAMLSeq } from 'yaml'
import { logger } from '../../../utils/logger.js'

const GATE_COMMENT = `
=============================================================================
 GATE (⚠️  Managed by Pipecraft - do not modify)
=============================================================================
 Gate job that ensures prior jobs succeed before allowing tag/promote/release.
 Uses pattern: allow only SUCCESS or SKIPPED results (failures block progression).
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

function buildIfExpression(jobNames: string[]): Scalar {
  const clauses = jobNames.map(
    name => `(needs['${name}'].result == 'success' || needs['${name}'].result == 'skipped')`
  )
  const expression = clauses.length > 0 ? `always() && ${clauses.join(' && ')}` : 'always()'
  const scalar = new Scalar(`\${{ ${expression} }}`)
  scalar.type = Scalar.QUOTE_DOUBLE
  return scalar
}

function ensureDefaultRunsAndSteps(gateMap: YAMLMap) {
  if (!gateMap.has('runs-on')) {
    gateMap.set('runs-on', new Scalar('ubuntu-latest'))
  }

  if (!gateMap.has('steps')) {
    const stepsSeq = new YAMLSeq()
    const stepMap = new YAMLMap()
    stepMap.set('name', new Scalar('Gate passed'))
    stepMap.set('run', new Scalar(DEFAULT_GATE_STEP_RUN))
    stepsSeq.items = [stepMap]
    gateMap.set('steps', stepsSeq)
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

export interface EnsureGateOptions {
  force: boolean
}

export function ensureGateJob(doc: Document.Parsed, options: EnsureGateOptions) {
  const { force } = options
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
    gatePair = new Pair(new Scalar('gate'), new YAMLMap())
    ;(gatePair as any).spaceBefore = true
    ;(gatePair as any).commentBefore = GATE_COMMENT.trimEnd()
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

  if (!(gatePair as any).commentBefore) {
    ;(gatePair as any).commentBefore = GATE_COMMENT.trimEnd()
  }

  if (!gateExisted) {
    ensureDefaultRunsAndSteps(gateMap as YAMLMap)
  }

  const shouldUpdateControlFields = force || !gateExisted

  if (shouldUpdateControlFields) {
    ;(gateMap as YAMLMap).set('needs', buildNeedsSequence(prerequisites))
    ;(gateMap as YAMLMap).set('if', buildIfExpression(prerequisites))
  }
}
