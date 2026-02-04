/**
 * Nx Pipeline Template
 *
 * Generates an Nx-optimized workflow that uses `nx affected` to intelligently test
 * only changed projects. Runs all Nx tasks sequentially in a single job, leveraging
 * Nx's built-in caching and parallel execution.
 *
 * This is Option 1 (Sequential Strategy) - simple, fast, and leverages Nx's intelligence.
 */

import { type PinionContext, renderTemplate, toFile } from '@featherscloud/pinion'
import fs from 'fs'
import { parseDocument, Scalar, stringify } from 'yaml'
import type { PipecraftConfig } from '../../types/index.js'
import { createValueFromString, type PathOperationConfig } from '../../utils/ast-path-operations.js'
import { logger } from '../../utils/logger.js'
import { formatIfConditions } from '../yaml-format-utils.js'
import {
  createChangesJobOperation,
  createDomainDeployJobOperations,
  createDomainRemoteTestJobOperations,
  createDomainTestJobOperations,
  createHeaderOperations,
  createTagPromoteReleaseOperations,
  createVersionJobOperation,
  createManagedWorkflowDocument,
  stringifyManagedWorkflow,
  applyManagedWorkflowOperations
} from './shared/index.js'

interface NxPipelineContext extends PinionContext {
  config: PipecraftConfig
  branchFlow: string[]
  outputPipelinePath?: string
}

/**
 * Extract user-customized section between markers from YAML content
 * Returns content WITHOUT the markers themselves
 * Uses unique delimiters as YAML comments (indentation-independent)
 */
function extractUserSection(yamlContent: string): string | null {
  // Match markers as YAML comments: any leading whitespace + one or more # + optional whitespace + marker
  // Example: "  ### <--START CUSTOM JOBS-->"
  const startMarkerRegex = /^.*#+\s*<--START CUSTOM JOBS-->\s*$/m
  const endMarkerRegex = /^.*#+\s*<--END CUSTOM JOBS-->\s*$/m

  const startMatch = yamlContent.match(startMarkerRegex)
  const endMatch = yamlContent.match(endMarkerRegex)

  if (!startMatch || !endMatch) {
    return null
  }

  const startIndex = startMatch.index! + startMatch[0].length
  const endIndex = endMatch.index!

  // Extract content between markers (NOT including the markers themselves)
  let extracted = yamlContent.substring(startIndex, endIndex)

  // Normalize whitespace: remove leading/trailing newlines
  // These will be added back consistently during insertion
  extracted = extracted.replace(/^\n+/, '')
  extracted = extracted.replace(/\n+$/, '')

  return extracted
}

function sanitizeUserSection(userSection: string | null, managedJobNames: string[]): string | null {
  if (!userSection) {
    return userSection
  }

  let sanitized = userSection

  for (const jobName of managedJobNames) {
    const escapedJobName = jobName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const jobBlockRegex = new RegExp(
      String.raw`(?:^[ \t]*#.*\n)*^[ \t]*${escapedJobName}:\s*\n(?:^[ \t]+.*\n?)*`,
      'gm'
    )
    sanitized = sanitized.replace(jobBlockRegex, '')
  }

  sanitized = sanitized.replace(/\n{3,}/g, '\n\n').trim()

  return sanitized.length > 0 ? sanitized : null
}

/**
 * Create the test-nx job operation (Nx-specific)
 */
function createTestNxJobOperation(ctx: NxPipelineContext): PathOperationConfig {
  const { config } = ctx
  const nxConfig = config.nx!
  const enableCache = nxConfig.enableCache !== false

  // Build the job steps
  const cacheStep = enableCache
    ? `
      - name: Cache Nx
        uses: actions/cache@v4
        with:
          path: .nx/cache
          key: \${{ runner.os }}-nx-\${{ hashFiles('**/nx.json', '**/.nxignore', '**/pnpm-lock.yaml', '**/yarn.lock', '**/package-lock.json', '**/bun.lockb') }}
          restore-keys: |
            \${{ runner.os }}-nx-`
    : ''

  // Build individual task steps
  const taskSteps = nxConfig.tasks
    .map(
      target => `
      - name: Run nx affected --target=${target}
        env:
          NX_PACKAGE: \${{ steps.nx_cli.outputs.package || 'nx@latest' }}
        run: |
          PACKAGE="\${NX_PACKAGE:-nx@latest}"
          BASE_REF="\${{ inputs.baseRef || '${nxConfig.baseRef || 'origin/main'}' }}"
          HEAD_REF="\${{ inputs.commitSha || github.sha }}"
          npx --yes --package "$PACKAGE" nx affected --target=${target} --base="$BASE_REF" --head="$HEAD_REF" || echo "No affected projects"`
    )
    .join('')

  return {
    path: 'jobs.test-nx',
    operation: 'preserve', // User can customize this job!
    commentBefore: `
=============================================================================
 TEST-NX ( ✅ Customize these with your test logic)
=============================================================================
 This job runs all Nx tasks sequentially using \`nx affected\`.
 Nx handles dependency detection, caching, and parallel execution internally.
`,
    value: createValueFromString(`
    needs: [ changes ]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ inputs.commitSha || github.sha }}
          fetch-depth: \${{ env.FETCH_DEPTH_AFFECTED }}
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
      - name: Determine Nx CLI package
        id: nx_cli
        shell: bash
        run: |
          NX_SPEC=""
          if [ -f "package.json" ]; then
            NX_SPEC=$(node - <<'NODE'
const fs = require('fs')
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const spec =
    (pkg.devDependencies && pkg.devDependencies.nx) ||
    (pkg.dependencies && pkg.dependencies.nx) ||
    ''
  if (typeof spec === 'string') {
    const cleaned = spec.trim()
    if (cleaned && !cleaned.startsWith('workspace:') && !cleaned.startsWith('file:')) {
      process.stdout.write(cleaned)
    }
  }
} catch {
  // Ignore parse errors and fall back to latest
}
NODE
            )
          fi
          if [ -n "$NX_SPEC" ]; then
            echo "package=nx@$NX_SPEC" >> $GITHUB_OUTPUT
          else
            echo "package=nx@latest" >> $GITHUB_OUTPUT
          fi
      ${cacheStep}${taskSteps}
  `)
  }
}

/**
 * Main generator that handles merging with existing workflow
 */
export const generate = (ctx: NxPipelineContext) =>
  Promise.resolve(ctx)
    .then(ctx => {
      const filePath = `${ctx.cwd || process.cwd()}/.github/workflows/pipeline.yml`
      const { config, branchFlow } = ctx
      const domains = config.domains || {}
      const nxConfig = config.nx!

      // Check if file exists early so we can reuse runtime defaults
      const fileExists = fs.existsSync(filePath)
      let existingContent = ''
      let existingEnv: Record<string, any> | null = null

      if (fileExists) {
        existingContent = fs.readFileSync(filePath, 'utf8')
        try {
          const envDoc = parseDocument(existingContent)
          const envNode =
            envDoc && typeof (envDoc as any).get === 'function' ? (envDoc as any).get('env') : null
          if (envNode && typeof (envNode as any).toJSON === 'function') {
            existingEnv = (envNode as any).toJSON()
          }
        } catch (error) {
          logger.warn(`⚠️  Failed to parse existing pipeline for runtime defaults: ${error}`)
        }
      }

      // Build operations array - only managed jobs
      const operations: PathOperationConfig[] = [
        // Header (name, run-name, on triggers)
        ...createHeaderOperations({
          branchFlow,
          nodeVersion: (existingEnv?.NODE_VERSION as string | undefined) ?? undefined,
          pnpmVersion: (existingEnv?.PNPM_VERSION as string | undefined) ?? undefined
        }),

        // Changes detection (Nx-enabled)
        createChangesJobOperation({
          domains,
          useNx: true,
          baseRef: nxConfig.baseRef || 'origin/main',
          config
        }),

        // Nx test job (runs all Nx tasks)
        createTestNxJobOperation(ctx),

        // Version calculation (depends on test-nx and changes)
        createVersionJobOperation({
          testJobNames: [], // No domain test job dependencies
          nxEnabled: true, // Depends on test-nx job
          baseRef: nxConfig.baseRef || 'origin/main',
          config
        }),

        // Tag, promote, release
        ...createTagPromoteReleaseOperations({
          branchFlow,
          autoMerge: typeof config.autoMerge === 'object' ? config.autoMerge : {},
          config
        })
      ]

      // Extract user-customized section and custom jobs from existing file if it exists
      let userSection: string | null = null
      const customJobsFromExisting: any[] = []
      if (fileExists) {
        userSection = sanitizeUserSection(extractUserSection(existingContent), ['test-nx'])
        if (userSection) {
          logger.verbose('📋 Found user-customized section between markers')
        }

        // Also extract custom jobs (for force mode preservation)
        const existingDoc = parseDocument(existingContent)
        const existingJobs =
          existingDoc.contents && (existingDoc.contents as any).get
            ? (existingDoc.contents as any).get('jobs')
            : null
        const managedJobs = new Set([
          'changes',
          'version',
          'gate',
          'tag',
          'promote',
          'release',
          'test-nx'
        ])
        if (existingJobs && (existingJobs as any).items) {
          for (const pair of (existingJobs as any).items) {
            const keyStr = pair.key instanceof Scalar ? pair.key.value : pair.key
            if (!managedJobs.has(keyStr as string)) {
              customJobsFromExisting.push(pair)
            }
          }
        }
        if (customJobsFromExisting.length > 0) {
          logger.verbose(`📋 Found ${customJobsFromExisting.length} custom job(s) to preserve`)
        }
      }

      // In force mode or new file, create fresh document to ensure correct structure
      if (!fileExists || ctx.pinion?.force) {
        const logMessage = !fileExists
          ? '📝 Creating new Nx pipeline'
          : '🔄 Force mode: Rebuilding Nx pipeline from scratch'
        logger.verbose(logMessage)

        const headerComment = `=============================================================================
 PIPECRAFT MANAGED WORKFLOW
=============================================================================

 ✅ YOU CAN CUSTOMIZE:
   - Custom jobs between the '# <--START CUSTOM JOBS-->' and '# <--END CUSTOM JOBS-->' comment markers
   - Workflow name

 ⚠️  PIPECRAFT MANAGES (do not modify):
   - Workflow triggers, job dependencies, and conditionals
   - Changes detection, version calculation, and tag creation
   - CreatePR, branch management, promote, and release jobs

 📌 VERSION PROMOTION BEHAVIOR:
   - Only commits that trigger a version bump will promote to staging/main
   - Non-versioned commits (test, build, etc.) remain on develop
   - This keeps staging/main aligned with tagged releases

 Running 'pipecraft generate' updates managed sections while preserving
 your customizations in test/deploy/smoke-test etc jobs.

 📖 Learn more: https://pipecraft.thecraftlab.dev
=============================================================================`
        const doc = createManagedWorkflowDocument(headerComment, operations, ctx)

        let yamlContent = stringifyManagedWorkflow(doc)

        // Insert user section and custom jobs after version job if they exist
        const hasCustomContent = userSection || customJobsFromExisting.length > 0
        if (hasCustomContent) {
          // Find the insertion point (after version job outputs)
          const versionOutputsPattern =
            /^ {2}version:\s*\n(?:.*\n)*? {4}outputs:\s*\n\s*version:.*$/m
          const match = yamlContent.match(versionOutputsPattern)

          if (match) {
            const insertionIndex = match.index! + match[0].length
            let contentToInsert = ''

            // Add user section if exists
            if (userSection) {
              contentToInsert += `# <--START CUSTOM JOBS-->\n\n${userSection}\n\n  # <--END CUSTOM JOBS-->`
            }

            // Add custom jobs if they exist (and weren't in user section)
            if (customJobsFromExisting.length > 0 && !userSection) {
              const customJobsYaml = customJobsFromExisting
                .map(pair => {
                  const keyStr = pair.key instanceof Scalar ? pair.key.value : pair.key
                  const valueYaml = stringify(pair.value, { indent: 2 })
                  return `  ${keyStr}:\n${valueYaml
                    .split('\n')
                    .map((line: string) => (line ? '  ' + line : line))
                    .join('\n')}`
                })
                .join('\n\n')
              contentToInsert = `# <--START CUSTOM JOBS-->\n\n${customJobsYaml}\n\n  # <--END CUSTOM JOBS-->`
            }

            if (contentToInsert) {
              yamlContent =
                yamlContent.slice(0, insertionIndex) +
                '\n\n  ' +
                contentToInsert +
                '\n' +
                yamlContent.slice(insertionIndex)
              logger.verbose('📋 Inserted user-customized section after version job')
            }
          } else {
            logger.verbose('⚠️  Could not find version job outputs, appending user section at end')
            const contentToInsert =
              userSection ||
              (customJobsFromExisting.length > 0
                ? customJobsFromExisting
                    .map(pair => {
                      const keyStr = pair.key instanceof Scalar ? pair.key.value : pair.key
                      const valueYaml = stringify(pair.value, { indent: 2 })
                      return `  ${keyStr}:\n${valueYaml
                        .split('\n')
                        .map((line: string) => (line ? '  ' + line : line))
                        .join('\n')}`
                    })
                    .join('\n\n')
                : '')
            const userSectionWithMarkers = `# <--START CUSTOM JOBS-->\n\n${contentToInsert}\n\n  # <--END CUSTOM JOBS-->`
            yamlContent = yamlContent + '\n\n  ' + userSectionWithMarkers
          }
        } else {
          // Ensure placeholder markers exist when no custom content is preserved
          const versionOutputsPattern =
            /^( {2}version:\s*\n(?:.*\n)*? {4}outputs:\s*\n\s*version:.*)$/m
          yamlContent = yamlContent.replace(
            versionOutputsPattern,
            '$1\n\n  # <--START CUSTOM JOBS-->\n\n  # <--END CUSTOM JOBS-->\n'
          )
          logger.verbose('📝 Added placeholder user section markers')
        }

        const formattedContent = formatIfConditions(yamlContent)
        const status = hasCustomContent ? 'merged' : fileExists ? 'rebuilt' : 'created'
        return { ...ctx, yamlContent: formattedContent, mergeStatus: status }
      }

      // Parse existing file for merge mode (no force flag)
      const freshContent = fs.readFileSync(filePath, 'utf8')
      const doc = parseDocument(freshContent)

      // Get managed jobs (always overwritten)
      const managedJobs = new Set(['changes', 'version', 'tag', 'promote', 'release', 'test-nx'])
      // test-nx is preserved (user can customize), but still managed if it doesn't exist

      // Extract custom jobs (not managed and not in user section between markers)
      const existingJobs =
        doc.contents && (doc.contents as any).get ? (doc.contents as any).get('jobs') : null
      const customJobs: any[] = []
      if (existingJobs && (existingJobs as any).items) {
        // Preserve jobs that are not managed
        for (const pair of (existingJobs as any).items) {
          const keyStr = pair.key instanceof Scalar ? pair.key.value : pair.key
          if (!managedJobs.has(keyStr as string)) {
            customJobs.push(pair)
          }
        }
        // Clear all jobs before applying operations to prevent duplicates
        ;(existingJobs as any).items = []
      }

      applyManagedWorkflowOperations(doc, operations, ctx)

      // Reinsert custom jobs (preserved from existing pipeline)
      if (existingJobs && customJobs.length > 0) {
        for (const customPair of customJobs) {
          existingJobs.add(customPair)
        }
        logger.verbose(`📋 Preserved ${customJobs.length} custom job(s) from existing pipeline`)
      }

      let yamlContent = stringifyManagedWorkflow(doc)

      // Insert user section after version job if it exists
      if (userSection) {
        const versionOutputsPattern = /^ {2}version:\s*\n(?:.*\n)*? {4}outputs:\s*\n\s*version:.*$/m
        const match = yamlContent.match(versionOutputsPattern)

        if (match) {
          const insertionIndex = match.index! + match[0].length
          const userSectionWithMarkers = `# <--START CUSTOM JOBS-->\n\n${userSection}\n\n  # <--END CUSTOM JOBS-->`
          yamlContent =
            yamlContent.slice(0, insertionIndex) +
            '\n\n  ' +
            userSectionWithMarkers +
            '\n' +
            yamlContent.slice(insertionIndex)
          logger.verbose('📋 Inserted user-customized section after version job')
        }
      }

      // Also insert custom jobs that weren't in the user section
      if (customJobs.length > 0 && !userSection) {
        const versionOutputsPattern = /^ {2}version:\s*\n(?:.*\n)*? {4}outputs:\s*\n\s*version:.*$/m
        const match = yamlContent.match(versionOutputsPattern)
        if (match) {
          const insertionIndex = match.index! + match[0].length
          const customJobsYaml = customJobs
            .map(pair => {
              const keyStr = pair.key instanceof Scalar ? pair.key.value : pair.key
              const valueYaml = stringify(pair.value, { indent: 2 })
              return `  ${keyStr}:\n${valueYaml
                .split('\n')
                .map((line: string) => (line ? '  ' + line : line))
                .join('\n')}`
            })
            .join('\n\n')
          yamlContent =
            yamlContent.slice(0, insertionIndex) +
            '\n\n  # <--START CUSTOM JOBS-->\n\n' +
            customJobsYaml +
            '\n\n  # <--END CUSTOM JOBS-->\n' +
            yamlContent.slice(insertionIndex)
        }
      }

      const status = userSection || customJobs.length > 0 ? 'merged' : 'updated'
      const formattedContent = formatIfConditions(yamlContent)
      return { ...ctx, yamlContent: formattedContent, mergeStatus: status }
    })
    .then(ctx => {
      const outputPath = ctx.outputPipelinePath || '.github/workflows/pipeline.yml'
      const status =
        ctx.mergeStatus === 'merged'
          ? '🔄 Merged with existing'
          : ctx.mergeStatus === 'updated'
          ? '🔄 Updated existing'
          : ctx.mergeStatus === 'rebuilt'
          ? '🔄 Rebuilt from scratch'
          : '📝 Created new'
      logger.verbose(`${status} ${outputPath}`)
      return ctx
    })
    .then(
      renderTemplate(
        (ctx: any) => ctx.yamlContent,
        toFile((ctx: any) => ctx.outputPipelinePath || '.github/workflows/pipeline.yml')
      )
    )
