/**
 * calculate-version: setup-node must not try to cache a package manager
 *
 * actions/setup-node@v5 defaults `package-manager-cache` to true, which auto-detects a
 * `packageManager` field in the checked-out package.json and invokes pnpm/yarn to resolve
 * its cache path. This action never installs a package manager (it only shells out to
 * `npx`), so on any repo whose package.json declares `packageManager`, the step fails with
 * "Unable to locate executable file: pnpm" and blocks the `gate` job downstream. Verified
 * live on this repo's own `develop` branch: issue #646.
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

describe('calculate-version setup-node package-manager-cache', () => {
  it('disables package-manager-cache on the Install Node.js step', async () => {
    const [workspace, cleanup] = createWorkspaceWithCleanup('pipecraft-calc-version-pm-cache')
    try {
      await inWorkspace(workspace, async () => {
        await generateCalcVersion(makeCtx(workspace))
        const content = readFileSync('.github/actions/calculate-version/action.yml', 'utf-8')
        const doc = parseYAML(content)

        const installNode = doc.runs.steps.find(
          (s: { name?: string }) => s.name === 'Install Node.js'
        )
        expect(installNode).toBeDefined()
        expect(installNode.uses).toMatch(/^actions\/setup-node@/)
        expect(installNode.with?.['package-manager-cache']).toBe(false)
      })
    } finally {
      cleanup()
    }
  })
})
