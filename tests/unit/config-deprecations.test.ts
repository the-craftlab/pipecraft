/**
 * config deprecation / no-op warnings (P1.6)
 *
 * mergeMethod and mergeStrategy: 'merge' are declared in the schema/types and documented,
 * but consumed nowhere — promotions always fast-forward. autoMerge is a deprecated alias
 * for autoPromote. Rather than break existing configs that set them, surface them honestly
 * as warnings so the dead surface is visible.
 */
import { describe, expect, it } from 'vitest'
import { getConfigWarnings, validateConfig } from '../../src/utils/config.js'
import { createMinimalConfig } from '../helpers/fixtures.js'

describe('config deprecation warnings', () => {
  it('warns that mergeMethod has no effect', () => {
    const warnings = getConfigWarnings(createMinimalConfig({ mergeMethod: 'squash' }))
    expect(warnings.join(' ')).toMatch(/mergeMethod/)
  })

  it("warns that mergeStrategy 'merge' is not implemented", () => {
    const warnings = getConfigWarnings(createMinimalConfig({ mergeStrategy: 'merge' }))
    expect(warnings.join(' ')).toMatch(/mergeStrategy/)
  })

  it('warns that autoMerge is deprecated in favor of autoPromote', () => {
    const warnings = getConfigWarnings(createMinimalConfig({ autoMerge: true }))
    expect(warnings.join(' ')).toMatch(/autoMerge/)
  })

  it('does not throw on these deprecated-but-known keys', () => {
    expect(() =>
      validateConfig(createMinimalConfig({ mergeMethod: 'squash', autoMerge: true }))
    ).not.toThrow()
  })

  it('emits no warnings for a clean fast-forward config', () => {
    expect(getConfigWarnings(createMinimalConfig())).toEqual([])
  })
})
