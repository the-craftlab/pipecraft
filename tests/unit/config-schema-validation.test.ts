/**
 * config schema enforcement (P0.2)
 *
 * validateConfig must reject unknown / misspelled keys, not silently ignore them.
 * Silent ignoring was the root cause of the historical autoMerge / nx config bugs:
 * a wrong key passed `pipecraft validate` and was dropped at generation time.
 */
import { describe, expect, it } from 'vitest'
import { validateConfig } from '../../src/utils/config.js'
import { createMinimalConfig } from '../helpers/fixtures.js'

describe('config schema enforcement', () => {
  it('accepts a valid config', () => {
    expect(() => validateConfig(createMinimalConfig())).not.toThrow()
  })

  it('accepts known optional keys (runtime, autoMerge alias)', () => {
    expect(() =>
      validateConfig(
        createMinimalConfig({
          runtime: { nodeVersion: '22', pnpmVersion: '10.6.2' },
          autoMerge: true
        })
      )
    ).not.toThrow()
  })

  it('rejects an unknown top-level key and names it', () => {
    const bad = { ...createMinimalConfig(), nx: { enabled: true } }
    expect(() => validateConfig(bad)).toThrow(/nx/)
  })

  it('rejects a misspelled key and names it', () => {
    const bad = { ...createMinimalConfig(), autoMrege: true }
    expect(() => validateConfig(bad)).toThrow(/autoMrege/)
  })

  it('rejects an unknown key inside a domain', () => {
    const bad = createMinimalConfig()
    ;(bad.domains.app as Record<string, unknown>).foo = 'bar'
    expect(() => validateConfig(bad)).toThrow(/foo/)
  })

  it('rejects an invalid enum value', () => {
    const bad = { ...createMinimalConfig(), ciProvider: 'bitbucket' }
    expect(() => validateConfig(bad as never)).toThrow()
  })

  it('still enforces cross-field invariants ajv cannot express', () => {
    const bad = createMinimalConfig({
      initialBranch: 'develop',
      finalBranch: 'main',
      branchFlow: ['main', 'develop'] // initial not first
    })
    expect(() => validateConfig(bad)).toThrow(/initialBranch/)
  })
})
