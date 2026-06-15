#!/usr/bin/env tsx
/**
 * Sync Actions Script
 *
 * Ensures that /actions/ directory is in sync with src/templates/actions/*.tpl.ts
 * templates. This script regenerates all actions from their templates and can
 * verify or update the /actions/ directory.
 *
 * Usage:
 *   pnpm sync-actions          # Regenerate all actions
 *   pnpm sync-actions --check  # Verify sync without changes
 *   pnpm sync-actions --verify # Same as --check
 *
 * Exit codes:
 *   0 - Success (sync or verification passed)
 *   1 - Verification failed (out of sync)
 *   2 - Error during generation
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// tests/scripts/ -> repo root
const rootDir = path.resolve(__dirname, '..', '..')

// Parse command line arguments
const args = process.argv.slice(2)
const checkMode = args.includes('--check') || args.includes('--verify')

console.log(`\n🔄 Action Sync ${checkMode ? '(Verification Mode)' : '(Regeneration Mode)'}\n`)

/**
 * Action templates and their output paths
 */
const ACTION_TEMPLATES = [
  { name: 'calculate-version', path: 'actions/calculate-version/action.yml' },
  { name: 'create-pr', path: 'actions/create-pr/action.yml' },
  { name: 'create-release', path: 'actions/create-release/action.yml' },
  { name: 'create-tag', path: 'actions/create-tag/action.yml' },
  { name: 'detect-changes', path: 'actions/detect-changes/action.yml' },
  { name: 'manage-branch', path: 'actions/manage-branch/action.yml' },
  { name: 'promote-branch', path: 'actions/promote-branch/action.yml' }
]

/**
 * Generate actions from templates by running a minimal PipeCraft generation
 */
function generateActionsToTemp(): string {
  // Create a temporary generation directory at the repo root
  const tempDir = path.join(rootDir, '.tmp-action-sync')
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
  fs.mkdirSync(tempDir, { recursive: true })

  // Minimal but schema-valid config. actionSourceMode 'source' makes generation
  // emit to actions/ (the directory this script keeps in sync).
  const minimalConfig = {
    ciProvider: 'github',
    mergeStrategy: 'fast-forward',
    requireConventionalCommits: true,
    actionSourceMode: 'source',
    initialBranch: 'develop',
    finalBranch: 'main',
    branchFlow: ['develop', 'main'],
    domains: {
      api: { paths: ['apps/api/**'], description: 'API service' }
    }
  }
  // Canonical filename; JSON content is valid for .pipecraftrc
  fs.writeFileSync(path.join(tempDir, '.pipecraftrc'), JSON.stringify(minimalConfig, null, 2))

  // git init (some templates inspect git state)
  execSync('git init', { cwd: tempDir, stdio: 'ignore' })

  // Run the built CLI with cwd=tempDir (Node uses the real cwd, not $PWD),
  // referencing dist by absolute path so output lands in tempDir/actions.
  const cliPath = path.join(rootDir, 'dist/cli/index.js')
  execSync(`node "${cliPath}" generate --skip-checks --force`, { cwd: tempDir, stdio: 'pipe' })

  return tempDir
}

function generateActionsFromTemplates(): void {
  console.log('📝 Generating actions from templates...\n')
  let tempDir: string | undefined
  try {
    tempDir = generateActionsToTemp()
    const generatedActionsDir = path.join(tempDir, 'actions')
    const targetActionsDir = path.join(rootDir, 'actions')

    if (!fs.existsSync(targetActionsDir)) {
      fs.mkdirSync(targetActionsDir, { recursive: true })
    }

    for (const action of ACTION_TEMPLATES) {
      const sourceDir = path.join(generatedActionsDir, action.name)
      const targetDir = path.join(targetActionsDir, action.name)
      if (fs.existsSync(sourceDir)) {
        if (fs.existsSync(targetDir)) {
          fs.rmSync(targetDir, { recursive: true, force: true })
        }
        fs.cpSync(sourceDir, targetDir, { recursive: true })
        console.log(`   ✅ ${action.name}`)
      }
    }

    console.log('\n✅ Actions regenerated successfully!\n')
  } catch (error) {
    console.error('\n❌ Error generating actions:', error)
    process.exit(2)
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  }
}

/**
 * Verify that /actions/ matches the templates
 */
function verifySync(): boolean {
  console.log('🔍 Verifying sync between templates and /actions/...\n')

  let tempDir: string | undefined
  let allMatch = true
  try {
    tempDir = generateActionsToTemp()
    const generatedActionsDir = path.join(tempDir, 'actions')

    for (const action of ACTION_TEMPLATES) {
      const generatedPath = path.join(generatedActionsDir, action.name, 'action.yml')
      const committedPath = path.join(rootDir, action.path)

      if (!fs.existsSync(generatedPath)) {
        console.log(`   ⚠️  ${action.name}: not generated (skipped)`)
        continue
      }
      if (!fs.existsSync(committedPath)) {
        console.log(`   ❌ ${action.name}: missing committed action file`)
        allMatch = false
        continue
      }

      // Compare CONTENT (mtimes are unreliable after a fresh checkout)
      const generated = fs.readFileSync(generatedPath, 'utf-8')
      const committed = fs.readFileSync(committedPath, 'utf-8')
      if (generated === committed) {
        console.log(`   ✅ ${action.name}`)
      } else {
        console.log(`   ❌ ${action.name}: out of sync with template`)
        allMatch = false
      }
    }
  } catch (error) {
    console.error('\n❌ Error verifying actions:', error)
    return false
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  }

  return allMatch
}

/**
 * Main execution
 */
function main(): void {
  try {
    // Build the project first to ensure latest templates
    console.log('🔨 Building project...\n')
    execSync('pnpm run build', { cwd: rootDir, stdio: 'inherit' })

    if (checkMode) {
      // Verification mode - check if in sync
      const isInSync = verifySync()

      if (!isInSync) {
        console.log('\n❌ Actions are out of sync with templates!')
        console.log('   Run `pnpm sync-actions` to regenerate.\n')
        process.exit(1)
      }

      console.log('\n✅ All actions are in sync with templates!\n')
      process.exit(0)
    } else {
      // Regeneration mode - generate from templates
      generateActionsFromTemplates()

      console.log('💡 Next steps:')
      console.log('   1. Review changes: git diff actions/')
      console.log('   2. Commit if correct: git add actions/ && git commit\n')

      process.exit(0)
    }
  } catch (error) {
    console.error('\n❌ Sync failed:', error)
    process.exit(2)
  }
}

main()
