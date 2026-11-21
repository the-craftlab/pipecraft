/**
 * mergeQueue: a repo using GitHub's merge queue needs `merge_group` in `on:`, otherwise the
 * required checks never report on the queue's temporary branch and the queue times out.
 *
 * On a merge_group run `github.ref_name` is `gh-readonly-queue/<base>/pr-<N>-<sha>`, so every
 * `github.ref_name == '<branch>'` clause in `tag`, `promote` and `release` is false and those
 * jobs skip. `version` is guarded by `github.event_name != 'pull_request'`, which is true for
 * merge_group, so it runs. `gate` is `always()` and passes when prerequisites succeeded or
 * were skipped.
 */
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYAML } from 'yaml'
import { createWorkspaceWithCleanup, inWorkspace } from '../helpers/workspace.js'

const cliPath = join(__dirname, '..', '..', 'dist', 'cli', 'index.js')

const config = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'examples', 'minimal', '.pipecraftrc.json'), 'utf-8')
)

describe('mergeQueue', () => {
  let workspace: string
  let cleanup: () => void

  beforeEach(() => {
    ;[workspace, cleanup] = createWorkspaceWithCleanup('merge-queue')
  })
  afterEach(() => cleanup())

  const generate = (overrides: Record<string, unknown> = {}): string => {
    execSync('git init', { cwd: workspace, stdio: 'pipe' })
    writeFileSync(
      join(workspace, '.pipecraftrc'),
      JSON.stringify({ ...config, ...overrides }, null, 2)
    )
    execSync(`node "${cliPath}" generate --skip-checks`, {
      cwd: workspace,
      stdio: 'pipe',
      timeout: 20000,
      env: { ...process.env, CI: 'true' }
    })
    return readFileSync(join(workspace, '.github/workflows/pipeline.yml'), 'utf-8')
  }

  const pipeline = (overrides: Record<string, unknown> = {}): any => parseYAML(generate(overrides))

  it('adds merge_group with checks_requested when true', async () => {
    await inWorkspace(workspace, () => {
      const doc = pipeline({ mergeQueue: true })

      expect(doc.on.merge_group.types).toEqual(['checks_requested'])
    })
  })

  it('compares merge_group.base_sha to github.sha in the changes job when true', async () => {
    await inWorkspace(workspace, () => {
      const doc = pipeline({ mergeQueue: true })
      const steps: any[] = doc.jobs.changes.steps
      const detect = steps.find(s => s.with && 'beforeSha' in s.with)

      // merge_group.base_sha sits before github.event.before, so a queue run wins the chain.
      expect(detect.with.beforeSha).toBe(
        "${{ inputs.beforeSha || github.event.merge_group.base_sha || github.event.before || '' }}"
      )
      // The generated action compares github.sha against a non-empty beforeSha.
      const action = readFileSync(
        join(workspace, '.github/actions/detect-changes/action.yml'),
        'utf-8'
      )
      expect(action).toContain('echo "base=$BEFORE_SHA" >> $GITHUB_OUTPUT')
      expect(action).toContain('echo "ref=${{ github.sha }}" >> $GITHUB_OUTPUT')
    })
  })

  it('adds the trigger to a file generated before the key, and drops it once the key is removed', async () => {
    await inWorkspace(workspace, () => {
      expect(generate()).not.toContain('merge_group')

      const withKey = pipeline({ mergeQueue: true })
      expect(withKey.on.merge_group.types).toEqual(['checks_requested'])
      const detect = withKey.jobs.changes.steps.find((s: any) => s.with && 'beforeSha' in s.with)
      expect(detect.with.beforeSha).toContain('github.event.merge_group.base_sha')

      // pipeline.yml is rewritten from config on every run, so removing the key removes the trigger.
      expect(generate()).not.toContain('merge_group')
    })
  })

  it('runs version and gate, and skips tag, promote and release, on a merge_group run', async () => {
    await inWorkspace(workspace, () => {
      const doc = pipeline({ mergeQueue: true })

      // test jobs: gated only on change detection, so they run when their domain changed.
      expect(String(doc.jobs['test-app'].if)).toBe("${{ needs.changes.outputs.app == 'true' }}")
      // version: true for merge_group because the event is not pull_request.
      expect(String(doc.jobs.version.if)).toContain("github.event_name != 'pull_request'")
      expect(String(doc.jobs.version.if)).not.toContain('merge_group')
      // gate: always() with a per-prerequisite result check, success or skipped.
      expect(String(doc.jobs.gate.if)).toBe('${{ always() }}')
      expect(JSON.stringify(doc.jobs.gate.steps[0])).toContain('needs.*.result')
      // Each clause below is false on merge_group: ref_name is gh-readonly-queue/<base>/pr-<N>-<sha>.
      expect(String(doc.jobs.tag.if)).toContain("github.ref_name == 'develop'")
      expect(String(doc.jobs.promote.if)).toContain(
        "(github.event_name == 'push' || github.event_name == 'workflow_dispatch')"
      )
      expect(String(doc.jobs.release.if)).toContain("github.ref_name == 'main'")
    })
  })

  it('generates identical bytes on a second run when true', async () => {
    await inWorkspace(workspace, () => {
      const first = generate({ mergeQueue: true })
      const second = generate({ mergeQueue: true })

      expect(second).toBe(first)
    })
  })

  it('emits no merge_group when the key is unset', async () => {
    await inWorkspace(workspace, () => {
      expect(generate()).not.toContain('merge_group')
    })
  })

  it('emits bytes identical to the golden when the key is unset', async () => {
    // Golden generated from examples/minimal at 61c278b, before this key existed.
    // Refresh it only when a generator change is intended: copy a fresh key-unset output over it.
    const golden = readFileSync(
      join(__dirname, '../snapshots/__snapshots__/minimal-cli-pipeline.yml'),
      'utf-8'
    )
    const raw = await inWorkspace(workspace, () => generate())

    expect(raw).toBe(golden)
  })
})
