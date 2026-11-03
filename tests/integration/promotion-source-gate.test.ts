/**
 * Only GitHub-authored commits promote
 *
 * Any push to a branch in the flow started the release: version, tag, promote. A direct
 * push to `develop` — a hotfix typed on the wrong branch, a script, a rebase pushed by
 * hand — cut a release nobody asked for.
 *
 * Code that arrives through a merged pull request carries `noreply@github.com` as its
 * committer, because GitHub creates that commit. A fast-forward promotion preserves it, so
 * the marker survives the whole chain: pipecraft's own `develop` and `main` both show
 * `noreply@github.com`. A commit pushed by a human keeps their address and is not promoted.
 *
 * `workflow_dispatch` stays open so a maintainer can promote deliberately.
 *
 * This gates `tag` and `promote` only. `version` still runs, so the workflow reports the
 * version it would have used, and the domain jobs still test the push.
 */
import { execSync } from 'child_process'
import { readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYAML } from 'yaml'
import { createWorkspaceWithCleanup, inWorkspace } from '../helpers/workspace.js'

const cliPath = join(__dirname, '..', '..', 'dist', 'cli', 'index.js')

const config = {
  ciProvider: 'github',
  mergeStrategy: 'fast-forward',
  requireConventionalCommits: true,
  initialBranch: 'develop',
  finalBranch: 'main',
  branchFlow: ['develop', 'staging', 'main'],
  autoPromote: { staging: true, main: true },
  semver: { bumpRules: { feat: 'minor', fix: 'patch' } },
  domains: { app: { paths: ['src/**'], description: 'App', prefixes: ['test'] } }
}

describe('promotion source gate', () => {
  let workspace: string
  let cleanup: () => void

  beforeEach(() => {
    ;[workspace, cleanup] = createWorkspaceWithCleanup('promotion-source-gate')
  })
  afterEach(() => cleanup())

  const pipeline = (overrides: Record<string, unknown> = {}): any => {
    execSync('git init', { cwd: workspace, stdio: 'pipe' })
    writeFileSync('.pipecraftrc', JSON.stringify({ ...config, ...overrides }, null, 2))
    execSync(`node "${cliPath}" generate --skip-checks`, {
      cwd: workspace,
      stdio: 'pipe',
      timeout: 20000,
      env: { ...process.env, CI: 'true' }
    })
    return parseYAML(readFileSync(join(workspace, '.github/workflows/pipeline.yml'), 'utf-8'))
  }

  it.each(['tag', 'promote'])('gates %s on a GitHub-authored commit', async job => {
    await inWorkspace(workspace, () => {
      const condition = String(pipeline().jobs[job].if)

      expect(condition).toContain(
        "github.event.head_commit.committer.email == 'noreply@github.com'"
      )
    })
  })

  it.each(['tag', 'promote'])('still allows %s via workflow_dispatch', async job => {
    await inWorkspace(workspace, () => {
      const condition = String(pipeline().jobs[job].if)

      // A maintainer must be able to promote deliberately even from a hand-pushed commit.
      expect(condition).toContain("github.event_name == 'workflow_dispatch'")
    })
  })

  it('leaves version ungated so the push still reports a version', async () => {
    await inWorkspace(workspace, () => {
      const condition = String(pipeline().jobs.version.if)

      expect(condition).not.toContain('committer.email')
    })
  })

  it('leaves domain jobs ungated so a direct push is still tested', async () => {
    await inWorkspace(workspace, () => {
      const condition = String(pipeline().jobs['test-app'].if)

      expect(condition).not.toContain('committer.email')
    })
  })

  it('keeps the existing branch and dependency conditions on tag', async () => {
    await inWorkspace(workspace, () => {
      const condition = String(pipeline().jobs.tag.if)

      // The new clause must be added to the guard, not replace it.
      expect(condition).toContain('github.ref_name')
      expect(condition).toContain('needs.version.result')
    })
  })

  describe('promoteDirectPushes', () => {
    const GATE = "github.event.head_commit.committer.email == 'noreply@github.com'"

    it.each(['tag', 'promote'])('drops the committer clause from %s when true', async job => {
      await inWorkspace(workspace, () => {
        const condition = String(pipeline({ promoteDirectPushes: true }).jobs[job].if)

        expect(condition).not.toContain('noreply@github.com')
        expect(condition).not.toContain('committer.email')
      })
    })

    it('keeps the version, gate and branch clauses on tag when true', async () => {
      await inWorkspace(workspace, () => {
        const condition = String(pipeline({ promoteDirectPushes: true }).jobs.tag.if)

        expect(condition).toContain("github.event_name != 'pull_request'")
        expect(condition).toContain("github.ref_name == 'develop'")
        expect(condition).toContain("needs.version.result == 'success'")
        expect(condition).toContain("needs.version.outputs.version != ''")
        expect(condition).toContain("needs.gate.result == 'success'")
      })
    })

    it('keeps the version, tag and branch clauses on promote when true', async () => {
      await inWorkspace(workspace, () => {
        const condition = String(pipeline({ promoteDirectPushes: true }).jobs.promote.if)

        expect(condition).toContain("github.event_name == 'push'")
        expect(condition).toContain("needs.version.result == 'success'")
        expect(condition).toContain("needs.version.outputs.version != ''")
        expect(condition).toContain("needs.tag.result == 'success'")
        expect(condition).toContain('github.ref_name')
      })
    })

    it.each([false, undefined])('keeps the committer clause when %s', async value => {
      await inWorkspace(workspace, () => {
        const jobs = pipeline(value === undefined ? {} : { promoteDirectPushes: value }).jobs

        expect(String(jobs.tag.if)).toContain(GATE)
        expect(String(jobs.promote.if)).toContain(GATE)
      })
    })

    it('generates the same pipeline for false as for an unset key', async () => {
      await inWorkspace(workspace, () => {
        const unset = pipeline()
        // generate preserves an existing `if`, so the second run starts from a clean tree.
        rmSync(join(workspace, '.github'), { recursive: true, force: true })
        const off = pipeline({ promoteDirectPushes: false })

        expect(off).toEqual(unset)
      })
    })

    describe('with an existing pipeline.yml', () => {
      const tagFile = () => join(workspace, '.github/workflows/pipeline.yml')

      it('strips the committer clause from a preserved tag.if when turned on', async () => {
        await inWorkspace(workspace, () => {
          expect(String(pipeline().jobs.tag.if)).toContain(GATE)

          const condition = String(pipeline({ promoteDirectPushes: true }).jobs.tag.if)

          expect(condition).not.toContain('noreply@github.com')
          expect(condition).toContain("github.ref_name == 'develop'")
          expect(condition).toContain("needs.version.result == 'success'")
          expect(condition).toContain("needs.gate.result == 'success'")
          expect(condition).not.toContain('&& &&')
        })
      })

      it('keeps a clause the user appended to tag.if', async () => {
        await inWorkspace(workspace, () => {
          pipeline()
          const text = readFileSync(tagFile(), 'utf-8')
          // The first gate in the file belongs to the tag job.
          const edited = text.replace(
            /(workflow_dispatch'\))(\s*\}\})/,
            "$1 &&\n        vars.RELEASE == 'on'$2"
          )
          writeFileSync(tagFile(), edited)
          const custom = parseYAML(readFileSync(tagFile(), 'utf-8')).jobs.tag.if
          expect(String(custom)).toContain("vars.RELEASE == 'on'")

          const condition = String(pipeline({ promoteDirectPushes: true }).jobs.tag.if)

          expect(condition).not.toContain('noreply@github.com')
          expect(condition).toContain("vars.RELEASE == 'on'")
          expect(condition).toContain("needs.gate.result == 'success'")
        })
      })

      it.each([false, undefined])('never edits an existing tag.if when %s', async value => {
        await inWorkspace(workspace, () => {
          const before = String(pipeline().jobs.tag.if)
          const after = String(
            pipeline(value === undefined ? {} : { promoteDirectPushes: value }).jobs.tag.if
          )

          expect(after).toBe(before)
          expect(after).toContain(GATE)
        })
      })
    })
  })
})
