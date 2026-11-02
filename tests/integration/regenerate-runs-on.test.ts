/**
 * `pipecraft generate` keeps a customized `runs-on` on every managed job
 *
 * The generated header of pipeline.yml says the `runs-on` of managed jobs is preserved across
 * `generate`. `changes`, `version`, `promote` and `release` are written with `overwrite` on
 * the whole job, and `tag` with `overwrite` on its `runs-on`, so a runner expression such as
 * `${{ vars.CI_RUNNER || 'ubuntu-latest' }}` came back as `ubuntu-latest` on the next run.
 */
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createWorkspaceWithCleanup, inWorkspace } from '../helpers/workspace.js'

const cliPath = join(__dirname, '..', '..', 'dist', 'cli', 'index.js')
const minimalConfigPath = join(__dirname, '..', '..', 'examples', 'minimal', '.pipecraftrc.json')

const RUNNER = "${{ vars.CI_RUNNER || 'ubuntu-latest' }}"
const MANAGED_JOBS = ['changes', 'version', 'tag', 'promote', 'release']

describe('generate preserves runs-on on managed jobs', () => {
  let workspace: string
  let cleanup: () => void

  beforeEach(() => {
    ;[workspace, cleanup] = createWorkspaceWithCleanup('regen-runs-on')
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

  const runsOn = (job: string): unknown =>
    parse(readFileSync(pipelinePath(), 'utf8')).jobs[job]['runs-on']

  it('keeps a runner expression on changes, version, tag, promote and release', async () => {
    await inWorkspace(workspace, () => {
      execSync('git init', { cwd: workspace, stdio: 'pipe' })
      writeFileSync('.pipecraftrc', readFileSync(minimalConfigPath, 'utf8'))
      generate()

      let text = readFileSync(pipelinePath(), 'utf8')
      for (const job of MANAGED_JOBS) {
        expect(runsOn(job)).toBe('ubuntu-latest')
      }
      // Edit the file in place so the custom-jobs markers and comments survive.
      text = text.replace(
        /^( {2}(?:changes|version|tag|promote|release):\n(?:(?! {2}\S).*\n)*? {4}runs-on: )ubuntu-latest$/gm,
        `$1${RUNNER}`
      )
      writeFileSync(pipelinePath(), text)
      for (const job of MANAGED_JOBS) expect(runsOn(job)).toBe(RUNNER)

      generate()

      for (const job of MANAGED_JOBS) {
        expect(runsOn(job)).toBe(RUNNER)
      }
    })
  })
})
