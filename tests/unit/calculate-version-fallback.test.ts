/**
 * calculate-version: nearest-reachable-tag fallback
 *
 * When a promotion PR is merged as a merge commit, the release tag is reachable
 * from HEAD but not directly on it. The exact-tag lookup misses it and
 * release-it finds no new version, so the version resolves empty and the release
 * is silently skipped. The fallback uses `git describe --tags --abbrev=0` to
 * recover the promoted version as a last resort.
 */
import type { PinionContext } from '@featherscloud/pinion'
import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { parse as parseYAML } from 'yaml'
import { generate as generateCalcVersion } from '../../src/templates/actions/calculate-version.yml.tpl.js'
import { createWorkspaceWithCleanup, inWorkspace } from '../helpers/workspace.js'

function makeCtx(workspace: string): PinionContext & { config?: Record<string, unknown> } {
  return {
    cwd: workspace,
    argv: ['generate'],
    config: { actionSourceMode: 'local' },
    pinion: {
      logger: { ...console, notice: console.log },
      prompt: async () => ({}),
      cwd: workspace,
      force: true,
      trace: [],
      exec: async () => 0
    }
  } as PinionContext & { config?: Record<string, unknown> }
}

describe('calculate-version nearest-reachable-tag fallback', () => {
  it('generates a fallback step gated behind all prior version lookups', async () => {
    const [workspace, cleanup] = createWorkspaceWithCleanup('pipecraft-calc-version')
    try {
      await inWorkspace(workspace, async () => {
        await generateCalcVersion(makeCtx(workspace))

        const action = readFileSync('.github/actions/calculate-version/action.yml', 'utf-8')

        // The fallback step exists and uses git describe for the nearest tag
        expect(action).toContain('id: get_version_nearest')
        expect(action).toContain('git describe --tags --abbrev=0')

        // It only runs as a last resort: the fallback step's `if` is gated on the
        // input version, the exact-tag lookup AND the release-it recompute all
        // being empty.
        const ifLine = action
          .split('\n')
          .find(
            l =>
              l.includes("check_input_version.outputs.version == ''") &&
              l.includes("get_version_old.outputs.version == ''") &&
              l.includes("get_version_new.outputs.version == ''")
          )
        expect(ifLine).toBeDefined()

        // set_version consumes the fallback after the calculated version
        expect(action).toContain('steps.get_version_nearest.outputs.version')
        const calcIdx = action.indexOf('Using calculated version')
        const nearestIdx = action.indexOf('Using nearest reachable tag version')
        expect(nearestIdx).toBeGreaterThan(calcIdx)
      })
    } finally {
      cleanup()
    }
  })

  it('produces valid YAML', async () => {
    const [workspace, cleanup] = createWorkspaceWithCleanup('pipecraft-calc-version-yaml')
    try {
      await inWorkspace(workspace, async () => {
        await generateCalcVersion(makeCtx(workspace))
        const content = readFileSync('.github/actions/calculate-version/action.yml', 'utf-8')
        expect(() => parseYAML(content)).not.toThrow()
        const doc = parseYAML(content)
        expect(doc.runs.using).toBe('composite')
      })
    } finally {
      cleanup()
    }
  })
})
