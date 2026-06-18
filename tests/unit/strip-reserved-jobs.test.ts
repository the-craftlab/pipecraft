/**
 * strip managed-named jobs from the custom section (P1.10 follow-up)
 *
 * Managed jobs (changes/version/gate/tag/promote/release) are emitted by the managed
 * operations. If one leaks into the extracted custom section it duplicates the key and
 * corrupts the workflow. stripReservedJobBlocks removes such blocks — and is a no-op on
 * the normal case, so ordinary custom jobs are untouched.
 */
import { describe, expect, it } from 'vitest'
import { stripReservedJobBlocks } from '../../src/templates/workflows/pipeline.yml.tpl.js'

describe('stripReservedJobBlocks', () => {
  it('removes a managed-named job block and reports it', () => {
    const section = `  test-app:
    runs-on: ubuntu-latest
    steps:
      - run: echo test
  release:
    runs-on: ubuntu-latest
    steps:
      - run: echo nope`
    const { cleaned, removed } = stripReservedJobBlocks(section)
    expect(removed).toEqual(['release'])
    expect(cleaned).toContain('test-app:')
    expect(cleaned).not.toContain('release:')
    expect(cleaned).not.toContain('echo nope')
  })

  it('is a no-op on a section with only custom jobs', () => {
    const section = `  test-app:
    runs-on: ubuntu-latest
  deploy-web:
    runs-on: ubuntu-latest`
    const result = stripReservedJobBlocks(section)
    expect(result.removed).toEqual([])
    expect(result.cleaned).toBe(section)
  })

  it('preserves a kept job that follows a removed managed job', () => {
    const section = `  changes:
    runs-on: ubuntu-latest
    steps:
      - run: echo leaked
  post-gate:
    needs: gate
    runs-on: ubuntu-latest`
    const { cleaned, removed } = stripReservedJobBlocks(section)
    expect(removed).toEqual(['changes'])
    expect(cleaned).toContain('post-gate:')
    expect(cleaned).toContain('needs: gate')
    expect(cleaned).not.toContain('echo leaked')
  })

  it('handles null and returns it unchanged', () => {
    expect(stripReservedJobBlocks(null)).toEqual({ cleaned: null, removed: [] })
  })
})
