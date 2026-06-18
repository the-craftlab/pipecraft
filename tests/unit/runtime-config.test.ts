/**
 * runtime config -> pipeline env versions
 *
 * config.runtime.{nodeVersion,pnpmVersion} drives the NODE_VERSION / PNPM_VERSION
 * workflow env vars. When provided in config the values are authoritative
 * (overwrite on regeneration); otherwise the existing value is preserved and
 * falls back to defaults.
 */
import { describe, expect, it } from 'vitest'
import { createHeaderOperations } from '../../src/templates/workflows/shared/operations-header.js'

function findOp(ops: ReturnType<typeof createHeaderOperations>, path: string) {
  return ops.find(o => o.path === path)
}

function scalarValue(op: { value?: unknown } | undefined): string {
  const v = op?.value as { value?: unknown } | string | undefined
  return String((v && typeof v === 'object' && 'value' in v ? v.value : v) ?? '')
}

describe('runtime config -> pipeline env versions', () => {
  it('overwrites NODE_VERSION/PNPM_VERSION when config.runtime provides them', () => {
    const ops = createHeaderOperations({
      branchFlow: ['develop', 'main'],
      nodeVersion: '24',
      pnpmVersion: '10.6.2',
      nodeVersionFromConfig: true,
      pnpmVersionFromConfig: true
    })

    const node = findOp(ops, 'env.NODE_VERSION')
    const pnpm = findOp(ops, 'env.PNPM_VERSION')

    expect(node?.operation).toBe('overwrite')
    expect(scalarValue(node)).toBe('24')
    expect(pnpm?.operation).toBe('overwrite')
    expect(scalarValue(pnpm)).toBe('10.6.2')
  })

  it('preserves and falls back to defaults (node 22, pnpm 10) when not config-driven', () => {
    const ops = createHeaderOperations({ branchFlow: ['develop', 'main'] })

    const node = findOp(ops, 'env.NODE_VERSION')
    const pnpm = findOp(ops, 'env.PNPM_VERSION')

    expect(node?.operation).toBe('preserve')
    expect(scalarValue(node)).toBe('22')
    expect(pnpm?.operation).toBe('preserve')
    // Default pnpm is pinned to an exact patch (not a floating major) for reproducibility.
    expect(scalarValue(pnpm)).toBe('10.6.2')
  })
})
