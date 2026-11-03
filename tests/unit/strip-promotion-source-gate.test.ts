import { describe, expect, it } from 'vitest'
import { stripPromotionSourceGate } from '../../src/templates/workflows/shared/operations-tag-promote'

const GATE =
  "(github.event.head_commit.committer.email == 'noreply@github.com' || github.event_name == 'workflow_dispatch')"

describe('stripPromotionSourceGate', () => {
  it('removes the gate and its leading && when it is the last clause', () => {
    expect(stripPromotionSourceGate(`\${{ a && b && ${GATE} }}`)).toBe('${{ a && b }}')
  })

  it('removes the gate and its trailing && when it sits mid-expression', () => {
    expect(stripPromotionSourceGate(`\${{ a && ${GATE} && b }}`)).toBe('${{ a && b }}')
  })

  it('matches the gate across folded whitespace', () => {
    const folded = GATE.replace(' || ', ' ||\n        ')
    expect(stripPromotionSourceGate(`\${{ a && ${folded} }}`)).toBe('${{ a }}')
  })

  it('leaves an expression without the gate unchanged', () => {
    expect(stripPromotionSourceGate('${{ a && b }}')).toBe('${{ a && b }}')
  })
})
