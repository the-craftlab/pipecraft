/**
 * gate must actually gate — including on PRs (P0.1)
 *
 * Two verified bugs in the generated gate:
 *  1. It required `needs.version.result == 'success'`, but the version job is skipped on
 *     pull_request events -> the gate was skipped on every PR (zero protection).
 *  2. The skip-tolerant `if` pattern made the gate *skip* when a prerequisite failed, and
 *     a skipped required check counts as passed -> broken changes could merge green.
 *
 * The robust pattern: the gate always runs (`if: always()`) and FAILS in-step when any
 * prerequisite failed or was cancelled. `needs.*.result` auto-includes user-added needs.
 */
import { Document, parseDocument } from 'yaml'
import { describe, expect, it } from 'vitest'
import { ensureGateJob } from '../../src/templates/workflows/shared/operations-gate.js'

function buildGate(priorJobs: string[]): any {
  const jobsYaml = priorJobs
    .map(name => `  ${name}:\n    runs-on: ubuntu-latest\n    steps: []`)
    .join('\n')
  const doc = parseDocument(`jobs:\n${jobsYaml}`)
  ensureGateJob(doc as Document.Parsed)
  return (doc.toJSON() as any).jobs.gate
}

describe('gate PR gating', () => {
  it('the gate always runs (so a skipped version job cannot make it skip on PRs)', () => {
    const gate = buildGate(['changes', 'version'])
    expect(gate.if).toContain('always()')
    // It must NOT hinge the whole gate on version succeeding.
    expect(gate.if).not.toContain("version'].result == 'success'")
    expect(gate.if).not.toContain('version.result')
  })

  it('fails in-step when any prerequisite failed or was cancelled', () => {
    const gate = buildGate(['changes', 'version', 'test-core'])
    const failStep = gate.steps.find(
      (s: any) => typeof s.if === 'string' && s.if.includes('needs.*.result')
    )
    expect(failStep, 'a step gated on needs.*.result must exist').toBeTruthy()
    expect(failStep.if).toContain("contains(needs.*.result, 'failure')")
    expect(failStep.if).toContain("contains(needs.*.result, 'cancelled')")
    expect(String(failStep.run)).toMatch(/exit 1/)
  })

  it('lists prior jobs as needs (so their results are visible to the gate)', () => {
    const gate = buildGate(['changes', 'version'])
    expect(gate.needs).toContain('changes')
    expect(gate.needs).toContain('version')
  })
})
