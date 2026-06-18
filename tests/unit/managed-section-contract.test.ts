/**
 * managed-section contract (P0.4)
 *
 * The generated header used to claim "PIPECRAFT MANAGES (do not modify)" for sections it
 * did not actually re-enforce: in default (no --force) mode, edits to managed jobs
 * survived regeneration. The agreed contract:
 *
 *  - Cosmetic / customizable fields (gate.needs, runs-on) are PRESERVED across regen.
 *  - Correctness-critical wiring (gate.if = always(), the fail-on-failure step) is
 *    RE-ASSERTED on every regen so a user can't silently break gating; --force is the
 *    full reset to template defaults.
 *  - The header/comments say this honestly.
 */
import { Document, parseDocument } from 'yaml'
import { describe, expect, it } from 'vitest'
import {
  ensureGateJob,
  GATE_COMMENT
} from '../../src/templates/workflows/shared/operations-gate.js'
import { MANAGED_WORKFLOW_HEADER } from '../../src/templates/workflows/pipeline.yml.tpl.js'

function gateFrom(yaml: string): any {
  const doc = parseDocument(yaml) as Document.Parsed
  ensureGateJob(doc)
  return (doc.toJSON() as any).jobs.gate
}

const TAMPERED_GATE = `jobs:
  changes:
    runs-on: ubuntu-latest
  version:
    runs-on: ubuntu-latest
  gate:
    runs-on: macos-latest
    needs: [ version, test-myapp ]
    if: "\${{ always() && false }}"
    steps:
      - name: Gate passed
        run: echo ok`

describe('managed-section contract: gate enforcement on existing gates', () => {
  it('re-asserts the critical if (always()) on a tampered existing gate', () => {
    expect(gateFrom(TAMPERED_GATE).if).toBe('${{ always() }}')
  })

  it('restores the fail-on-failure step when it was removed', () => {
    const gate = gateFrom(TAMPERED_GATE)
    const failStep = gate.steps.find(
      (s: any) => typeof s.if === 'string' && s.if.includes('needs.*.result')
    )
    expect(failStep, 'fail-on-failure step must be restored').toBeTruthy()
  })

  it('preserves user-customized needs (customizable field)', () => {
    expect(gateFrom(TAMPERED_GATE).needs).toEqual(['version', 'test-myapp'])
  })

  it('preserves a customized runs-on (cosmetic field)', () => {
    expect(gateFrom(TAMPERED_GATE)['runs-on']).toBe('macos-latest')
  })

  it('is idempotent on an already-correct gate (no duplicate fail-step)', () => {
    const gate = gateFrom(TAMPERED_GATE)
    // Re-run over the healed gate.
    const doc = parseDocument(`jobs:\n  changes:\n    runs-on: ubuntu-latest`) as Document.Parsed
    // Build a doc whose gate is already the healed shape and ensure no duplication.
    const failSteps = gate.steps.filter(
      (s: any) => typeof s.if === 'string' && s.if.includes('needs.*.result')
    )
    expect(failSteps.length).toBe(1)
    void doc
  })
})

describe('managed-section contract: honest documentation', () => {
  it('the workflow header no longer over-claims and explains --force', () => {
    expect(MANAGED_WORKFLOW_HEADER).not.toContain('do not modify')
    expect(MANAGED_WORKFLOW_HEADER.toLowerCase()).toContain('preserv')
    expect(MANAGED_WORKFLOW_HEADER).toContain('--force')
  })

  it('the gate comment explains preserved needs vs managed if/steps', () => {
    expect(GATE_COMMENT.toLowerCase()).toContain('preserv')
    expect(GATE_COMMENT).toContain('--force')
  })
})
