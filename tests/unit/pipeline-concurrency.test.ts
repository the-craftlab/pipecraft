/**
 * concurrency guard (P1.7)
 *
 * Without a concurrency group, two rapid pushes / a re-run produce racing
 * version -> tag -> promote sequences (TOCTOU on temp branches and PR-existence checks,
 * racing --ff-only pushes that half-promote). The generated workflow must declare a
 * per-branch concurrency group, queued (cancel-in-progress: false) to protect release
 * integrity.
 */
import { describe, expect, it } from 'vitest'
import { createHeaderOperations } from '../../src/templates/workflows/shared/operations-header.js'

describe('pipeline concurrency guard', () => {
  const ops = createHeaderOperations({ branchFlow: ['develop', 'main'] })
  const concurrency = ops.find(o => o.path === 'concurrency')

  it('emits a concurrency operation', () => {
    expect(concurrency).toBeTruthy()
  })

  it('groups by branch and does not cancel in-progress runs', () => {
    const value = concurrency?.value as { group?: unknown; 'cancel-in-progress'?: unknown }
    expect(String(value.group)).toContain('github.ref_name')
    expect(value['cancel-in-progress']).toBe(false)
  })

  it('is added when missing but preserves a user-defined group', () => {
    // 'preserve' semantics: created when absent, kept when present.
    expect(concurrency?.operation).toBe('preserve')
  })
})
