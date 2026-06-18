/**
 * action drift guard (P0.5)
 *
 * Nx-based change detection was removed project-wide, but the default `local`-mode copy
 * at .github/actions/detect-changes/ kept ~59 stale Nx references with a contract that
 * no longer matches the template. The existing `sync-actions` gate only covered
 * `actions/` (source mode), so this drift went unnoticed.
 *
 * These guards catch the class of regression directly: no committed action may reference
 * removed Nx tooling, and every locally-referenced action must exist on disk.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

// Unambiguous markers of the removed Nx integration (avoid the bare word "affected",
// which can appear in legitimate prose).
const STALE_NX_MARKERS = [
  'useNx',
  'nxAvailable',
  'affectedProjects',
  'npx nx',
  'nx show',
  'nx affected',
  'nx.json'
]

function collectActionYmls(baseRel: string): string[] {
  const base = join(repoRoot, baseRel)
  if (!existsSync(base)) return []
  const out: string[] = []
  for (const entry of readdirSync(base)) {
    const actionYml = join(base, entry, 'action.yml')
    if (existsSync(actionYml) && statSync(actionYml).isFile()) out.push(actionYml)
  }
  return out
}

describe('action drift guard', () => {
  const actionFiles = [...collectActionYmls('actions'), ...collectActionYmls('.github/actions')]

  it('finds action.yml files to scan', () => {
    expect(actionFiles.length).toBeGreaterThan(0)
  })

  it('no committed action references removed Nx tooling', () => {
    const offenders: string[] = []
    for (const file of actionFiles) {
      const content = readFileSync(file, 'utf8')
      const hits = STALE_NX_MARKERS.filter(m => content.includes(m))
      if (hits.length > 0) {
        offenders.push(`${file.replace(repoRoot + '/', '')} -> ${hits.join(', ')}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('every locally-referenced action (./.github/actions/<name>) exists on disk', () => {
    const workflowsDir = join(repoRoot, '.github/workflows')
    const referenced = new Set<string>()
    for (const file of readdirSync(workflowsDir)) {
      if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue
      const content = readFileSync(join(workflowsDir, file), 'utf8')
      for (const match of content.matchAll(/\.\/\.github\/actions\/([a-z0-9-]+)/gi)) {
        referenced.add(match[1])
      }
    }
    const missing = [...referenced].filter(
      name => !existsSync(join(repoRoot, '.github/actions', name))
    )
    expect(missing).toEqual([])
  })
})
