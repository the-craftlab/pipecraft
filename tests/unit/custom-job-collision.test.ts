/**
 * duplicate job key detection (P1.10)
 *
 * A custom job whose name collides with a managed job (changes/version/gate/tag/promote/
 * release) produces duplicate YAML keys -> an unparseable workflow. Generation detects this
 * in the final output and surfaces a non-fatal warning (the lenient marker/merge path can
 * produce duplicates in messy edge cases; hard-failing there would regress preservation —
 * the deeper merge-dedup fix is tracked in ROADMAP). findDuplicateKeyMessages is the
 * detection used to drive that warning.
 */
import { describe, expect, it } from 'vitest'
import { findDuplicateKeyMessages } from '../../src/templates/workflows/pipeline.yml.tpl.js'

describe('duplicate job key detection', () => {
  it('detects a custom job shadowing a managed job (duplicate key)', () => {
    const yaml = `jobs:
  changes:
    runs-on: ubuntu-latest
  release:
    runs-on: ubuntu-latest
  release:
    runs-on: ubuntu-latest`
    expect(findDuplicateKeyMessages(yaml).length).toBeGreaterThan(0)
  })

  it('reports nothing for a workflow with unique job keys', () => {
    const yaml = `jobs:
  changes:
    runs-on: ubuntu-latest
  test-core:
    runs-on: ubuntu-latest
  post-gate:
    runs-on: ubuntu-latest`
    expect(findDuplicateKeyMessages(yaml)).toEqual([])
  })
})
