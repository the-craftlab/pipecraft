/**
 * `promote` waits for `gate`, and `generate` keeps extra `needs` entries on promote and release
 *
 * `promote` ran when `tag` was skipped, and a failed `gate` skips `tag`, so with
 * `autoPromote: true` a failing test fast-forwarded the next branch (#656). The generated
 * header also says the `needs` list of managed jobs is preserved, but `promote` and `release`
 * are written with `overwrite` on the whole job, so an entry the user added came back removed
 * on the next `generate`. `version` is left out on purpose: its `needs` is built from the
 * config's domain test jobs, so keeping old entries would leave a removed domain in the list.
 */
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createWorkspaceWithCleanup, inWorkspace } from '../helpers/workspace.js'

const cliPath = join(__dirname, '..', '..', 'dist', 'cli', 'index.js')
const minimalConfigPath = join(__dirname, '..', '..', 'examples', 'minimal', '.pipecraftrc.json')

type Result = 'success' | 'failure' | 'skipped'

/**
 * Evaluates a workflow `if:` expression. The generated conditions use only `&&`, `||`, `==`,
 * `!=`, string literals, property access and `always()`, which JavaScript reads the same way.
 */
function evaluateIf(expression: string, needs: Record<string, Result>, refName: string): boolean {
  const body = expression.replace(/^\$\{\{\s*/, '').replace(/\s*\}\}$/, '')
  const context = {
    github: {
      event_name: 'push',
      ref_name: refName,
      event: { head_commit: { committer: { email: 'noreply@github.com' } } }
    },
    inputs: {},
    needs: Object.fromEntries(
      Object.entries(needs).map(([job, result]) => [job, { result, outputs: { version: '1.2.3' } }])
    )
  }
  const fn = new Function('always', 'github', 'inputs', 'needs', `return (${body})`)
  return Boolean(fn(() => true, context.github, context.inputs, context.needs))
}

describe('generate wires promote to gate and keeps extra needs', () => {
  let workspace: string
  let cleanup: () => void

  beforeEach(() => {
    ;[workspace, cleanup] = createWorkspaceWithCleanup('regen-needs')
  })
  afterEach(() => cleanup())

  const pipelinePath = () => join(workspace, '.github', 'workflows', 'pipeline.yml')

  const generate = (): string =>
    execSync(`node "${cliPath}" generate --skip-checks 2>&1`, {
      cwd: workspace,
      encoding: 'utf8',
      timeout: 20000,
      env: { ...process.env, CI: 'true' }
    })

  const job = (name: string) => parse(readFileSync(pipelinePath(), 'utf8')).jobs[name]

  const setup = () => {
    execSync('git init', { cwd: workspace, stdio: 'pipe' })
    writeFileSync('.pipecraftrc', readFileSync(minimalConfigPath, 'utf8'))
    generate()
  }

  it('does not run promote on the initial branch when gate fails', async () => {
    await inWorkspace(workspace, () => {
      setup()

      const promote = job('promote')
      expect(promote.needs).toContain('gate')

      const passing: Record<string, Result> = {
        version: 'success',
        tag: 'success',
        gate: 'success'
      }
      expect(evaluateIf(promote.if, passing, 'develop')).toBe(true)
      // A failed gate skips tag, which is the state that used to let promote run.
      expect(
        evaluateIf(promote.if, { ...passing, tag: 'skipped', gate: 'failure' }, 'develop')
      ).toBe(false)
    })
  })

  it('adds gate to a promote job generated before the fix', async () => {
    await inWorkspace(workspace, () => {
      setup()

      const text = readFileSync(pipelinePath(), 'utf8')
      const old = text
        .replace(/(\n {2}promote:\n(?:.*\n)*? {4}needs: )\[[^\]]*\]/, '$1[ version, tag ]')
        .replace(/ && needs\.gate\.result == 'success'(?=[^\n]*\n {4}runs-on)/, '')
      writeFileSync(pipelinePath(), old)
      expect(job('promote').needs).toEqual(['version', 'tag'])

      generate()

      expect(job('promote').needs).toContain('gate')
      expect(job('promote').if).toContain("needs.gate.result == 'success'")
    })
  })

  it('keeps an extra needs entry on promote and release', async () => {
    await inWorkspace(workspace, () => {
      setup()

      let text = readFileSync(pipelinePath(), 'utf8')
      for (const name of ['promote', 'release']) {
        const before = new RegExp(`(\\n {2}${name}:\\n(?:.*\\n)*? {4}needs: \\[[^\\]]*?) \\]`)
        expect(text).toMatch(before)
        text = text.replace(before, '$1, org-checks ]')
      }
      writeFileSync(pipelinePath(), text)
      for (const name of ['promote', 'release']) {
        expect(job(name).needs).toContain('org-checks')
      }

      generate()

      for (const name of ['promote', 'release']) {
        expect(job(name).needs).toContain('org-checks')
      }
      expect(job('promote').needs).toEqual(expect.arrayContaining(['version', 'tag', 'gate']))
      // Listed once each: the union does not duplicate what the template already names.
      expect(job('promote').needs.filter((n: string) => n === 'gate')).toHaveLength(1)
    })
  })
})
