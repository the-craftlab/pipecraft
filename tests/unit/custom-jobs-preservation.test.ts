/**
 * Tests for custom jobs preservation during pipeline regeneration
 *
 * This test suite verifies that Pipecraft correctly preserves user-defined
 * custom jobs when regenerating pipelines, especially when:
 * - Custom jobs exist between markers
 * - Custom jobs exist outside markers
 * - Markers are missing
 * - Custom jobs are scattered throughout the jobs section
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createPipecraftWorkspace,
  inWorkspace,
  cleanupTestWorkspace
} from '../helpers/workspace.js'
import fs from 'fs'
import path from 'path'
import { generate as generateWorkflows } from '../../src/generators/workflows.tpl.js'
import type { PinionContext } from '@featherscloud/pinion'
import type { PipecraftConfig } from '../../src/types/config.js'

describe('Custom Jobs Preservation', () => {
  let workspace: string

  beforeEach(() => {
    workspace = createPipecraftWorkspace('custom-jobs-preservation')
  })

  afterEach(() => {
    cleanupTestWorkspace(workspace)
  })

  // Helper function to create a proper pinion context
  function createContext(config: PipecraftConfig): PinionContext & { config?: PipecraftConfig } {
    return {
      cwd: workspace,
      argv: ['generate'],
      pinion: {
        logger: {
          ...console,
          notice: console.log
        },
        prompt: async () => ({}),
        cwd: workspace,
        force: true,
        trace: [],
        exec: async () => 0
      },
      config
    }
  }

  it('preserves custom jobs between markers when regenerating', async () => {
    await inWorkspace(workspace, async () => {
      // Create initial config
      const config: PipecraftConfig = {
        ciProvider: 'github',
        mergeStrategy: 'fast-forward',
        requireConventionalCommits: true,
        initialBranch: 'develop',
        finalBranch: 'main',
        branchFlow: ['develop', 'main'],
        domains: {
          core: {
            paths: ['src/**'],
            description: 'Core application'
          }
        }
      }

      fs.writeFileSync('.pipecraftrc', JSON.stringify(config, null, 2))

      // Ensure .github/workflows directory exists
      const workflowsDir = path.join(workspace, '.github', 'workflows')
      fs.mkdirSync(workflowsDir, { recursive: true })

      // Create context for generateWorkflows
      const ctx = createContext(config)

      // Generate initial pipeline
      await generateWorkflows(ctx)

      // Read generated pipeline
      const pipelinePath = path.join(workspace, '.github/workflows/pipeline.yml')
      let pipelineContent = fs.readFileSync(pipelinePath, 'utf8')

      // Find the custom jobs markers and insert custom jobs
      const customJobs = `
  lint:
    needs: changes
    if: \${{ needs.changes.outputs.core == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run lint
        run: echo "Linting code"

  test-core:
    needs: changes
    if: \${{ needs.changes.outputs.core == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: echo "Running tests"

  build-app:
    needs: [lint, test-core]
    if: \${{ always() && needs.lint.result == 'success' && needs.test-core.result == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build application
        run: echo "Building app"`

      // Insert custom jobs between markers
      pipelineContent = pipelineContent.replace(
        /(# <--START CUSTOM JOBS-->)\s*(# <--END CUSTOM JOBS-->)/,
        `$1${customJobs}\n\n  $2`
      )

      fs.writeFileSync(pipelinePath, pipelineContent)

      // Count lines before regeneration
      const linesBefore = pipelineContent.split('\n').length
      const customJobsBefore =
        pipelineContent.match(/^ {2}(lint|test-core|build-app):/gm)?.length || 0

      expect(customJobsBefore).toBe(3)
      expect(linesBefore).toBeGreaterThan(200)

      // Regenerate pipeline (should preserve custom jobs)
      await generateWorkflows(ctx)

      // Read regenerated pipeline
      const regeneratedContent = fs.readFileSync(pipelinePath, 'utf8')
      const linesAfter = regeneratedContent.split('\n').length
      const customJobsAfter =
        regeneratedContent.match(/^ {2}(lint|test-core|build-app):/gm)?.length || 0

      // Verify custom jobs are preserved
      expect(customJobsAfter).toBe(3)
      expect(regeneratedContent).toContain('lint:')
      expect(regeneratedContent).toContain('test-core:')
      expect(regeneratedContent).toContain('build-app:')
      expect(regeneratedContent).toContain('# <--START CUSTOM JOBS-->')
      expect(regeneratedContent).toContain('# <--END CUSTOM JOBS-->')

      // Line count should be similar (allowing for some variation in formatting)
      expect(Math.abs(linesAfter - linesBefore)).toBeLessThan(20)
    })
  })

  it('handles missing markers gracefully', async () => {
    await inWorkspace(workspace, async () => {
      // Create config
      const config: PipecraftConfig = {
        ciProvider: 'github',
        mergeStrategy: 'fast-forward',
        requireConventionalCommits: true,
        initialBranch: 'develop',
        finalBranch: 'main',
        branchFlow: ['develop', 'main'],
        domains: {
          core: {
            paths: ['src/**'],
            description: 'Core application'
          }
        }
      }

      fs.writeFileSync('.pipecraftrc', JSON.stringify(config, null, 2))

      // Ensure .github/workflows directory exists
      const workflowsDir = path.join(workspace, '.github', 'workflows')
      fs.mkdirSync(workflowsDir, { recursive: true })

      // Create context for generateWorkflows
      const ctx = createContext(config)

      // Generate initial pipeline
      await generateWorkflows(ctx)

      // Read and modify pipeline to remove markers
      const pipelinePath = path.join(workspace, '.github/workflows/pipeline.yml')
      let pipelineContent = fs.readFileSync(pipelinePath, 'utf8')

      // Remove the markers but keep the space
      pipelineContent = pipelineContent.replace(/# <--START CUSTOM JOBS-->/g, '')
      pipelineContent = pipelineContent.replace(/# <--END CUSTOM JOBS-->/g, '')

      fs.writeFileSync(pipelinePath, pipelineContent)

      // Regenerate (should add markers back)
      await generateWorkflows(ctx)

      const regeneratedContent = fs.readFileSync(pipelinePath, 'utf8')

      // Markers should be added back
      expect(regeneratedContent).toContain('# <--START CUSTOM JOBS-->')
      expect(regeneratedContent).toContain('# <--END CUSTOM JOBS-->')
    })
  })

  it('preserves custom jobs even when scattered outside markers', async () => {
    await inWorkspace(workspace, async () => {
      // Create config
      const config: PipecraftConfig = {
        ciProvider: 'github',
        mergeStrategy: 'fast-forward',
        requireConventionalCommits: true,
        initialBranch: 'develop',
        finalBranch: 'main',
        branchFlow: ['develop', 'main'],
        domains: {
          core: {
            paths: ['src/**'],
            description: 'Core application'
          }
        }
      }

      fs.writeFileSync('.pipecraftrc', JSON.stringify(config, null, 2))

      // Ensure .github/workflows directory exists
      const workflowsDir = path.join(workspace, '.github', 'workflows')
      fs.mkdirSync(workflowsDir, { recursive: true })

      // Create context for generateWorkflows
      const ctx = createContext(config)

      // Generate initial pipeline
      await generateWorkflows(ctx)

      // Read pipeline and manually add custom jobs OUTSIDE the markers
      const pipelinePath = path.join(workspace, '.github/workflows/pipeline.yml')
      let pipelineContent = fs.readFileSync(pipelinePath, 'utf8')

      // Add a custom job before the changes job
      const customJobBefore = `
  pre-check:
    runs-on: ubuntu-latest
    steps:
      - name: Pre-check
        run: echo "Pre-check before changes detection"
`

      // Add a custom job after the gate job
      const customJobAfter = `
  post-gate:
    needs: gate
    runs-on: ubuntu-latest
    steps:
      - name: Post-gate action
        run: echo "Action after gate"
`

      // Insert custom job before changes
      pipelineContent = pipelineContent.replace(/(jobs:\s*\n)/, `$1${customJobBefore}\n`)

      // Insert custom job after gate
      pipelineContent = pipelineContent.replace(
        /(# <--END CUSTOM JOBS-->)/,
        `$1\n${customJobAfter}`
      )

      fs.writeFileSync(pipelinePath, pipelineContent)

      // Verify jobs are present before regeneration
      expect(pipelineContent).toContain('pre-check:')
      expect(pipelineContent).toContain('post-gate:')

      // Regenerate
      await generateWorkflows(ctx)

      const regeneratedContent = fs.readFileSync(pipelinePath, 'utf8')

      // CRITICAL: Custom jobs should still exist
      // This is the failing case that needs to be fixed
      expect(regeneratedContent).toContain('pre-check:')
      expect(regeneratedContent).toContain('post-gate:')
    })
  })

  it('preserves large custom jobs sections (2000+ lines)', async () => {
    await inWorkspace(workspace, async () => {
      // Create config
      const config: PipecraftConfig = {
        ciProvider: 'github',
        mergeStrategy: 'fast-forward',
        requireConventionalCommits: true,
        initialBranch: 'develop',
        finalBranch: 'main',
        branchFlow: ['develop', 'main'],
        domains: {
          core: {
            paths: ['src/**'],
            description: 'Core application'
          }
        }
      }

      fs.writeFileSync('.pipecraftrc', JSON.stringify(config, null, 2))

      // Ensure .github/workflows directory exists
      const workflowsDir = path.join(workspace, '.github', 'workflows')
      fs.mkdirSync(workflowsDir, { recursive: true })

      // Create context for generateWorkflows
      const ctx = createContext(config)

      // Generate initial pipeline
      await generateWorkflows(ctx)

      // Create a large custom jobs section
      const pipelinePath = path.join(workspace, '.github/workflows/pipeline.yml')
      let pipelineContent = fs.readFileSync(pipelinePath, 'utf8')

      // Generate 50 custom jobs (simulating a large real-world pipeline)
      const customJobs = Array.from(
        { length: 50 },
        (_, i) => `
  test-domain-${i}:
    needs: changes
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test domain ${i}
        run: |
          echo "Testing domain ${i}"
          echo "This is a multi-line step"
          echo "With lots of commands"
          echo "To simulate real-world usage"
          echo "Domain ${i} tests complete"

  build-domain-${i}:
    needs: test-domain-${i}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build domain ${i}
        run: |
          echo "Building domain ${i}"
          echo "Compiling code"
          echo "Running build steps"
          echo "Domain ${i} build complete"

  deploy-domain-${i}:
    needs: build-domain-${i}
    if: \${{ github.ref_name == 'main' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy domain ${i}
        run: |
          echo "Deploying domain ${i}"
          echo "Connecting to deployment target"
          echo "Uploading artifacts"
          echo "Domain ${i} deployment complete"`
      ).join('\n\n')

      // Insert large custom jobs section
      pipelineContent = pipelineContent.replace(
        /(# <--START CUSTOM JOBS-->)\s*(# <--END CUSTOM JOBS-->)/,
        `$1${customJobs}\n\n  $2`
      )

      fs.writeFileSync(pipelinePath, pipelineContent)

      // Count lines and jobs before regeneration
      const linesBefore = pipelineContent.split('\n').length
      const jobsBeforeCount = (pipelineContent.match(/^ {2}[a-z0-9_-]+:/gm) || []).length

      expect(linesBefore).toBeGreaterThan(2000)
      expect(jobsBeforeCount).toBeGreaterThan(150) // 50 domains * 3 jobs each + managed jobs

      // Regenerate pipeline
      await generateWorkflows(ctx)

      // Read regenerated pipeline
      const regeneratedContent = fs.readFileSync(pipelinePath, 'utf8')
      const linesAfter = regeneratedContent.split('\n').length
      const jobsAfterCount = (regeneratedContent.match(/^ {2}[a-z0-9_-]+:/gm) || []).length

      // CRITICAL: Should preserve all custom jobs
      expect(jobsAfterCount).toBe(jobsBeforeCount)
      expect(linesAfter).toBeGreaterThan(2000)
      expect(Math.abs(linesAfter - linesBefore)).toBeLessThan(50)

      // Verify specific jobs are still present
      expect(regeneratedContent).toContain('test-domain-0:')
      expect(regeneratedContent).toContain('build-domain-25:')
      expect(regeneratedContent).toContain('deploy-domain-49:')
    })
  })
})
