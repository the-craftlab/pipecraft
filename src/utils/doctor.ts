/**
 * Pipecraft Doctor - Diagnostic Health Check
 *
 * Performs comprehensive health checks on a Pipecraft setup:
 * - Configuration validation
 * - GitHub workflow permissions
 * - Branch existence on remote
 * - Generated file verification
 * - Workflow semantic validation
 * - Domain path validation
 *
 * @module utils/doctor
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { glob } from 'glob'

import type { PipecraftConfig } from '../types/index.js'
import { loadConfig, validateConfig } from './config.js'
import {
  getGitHubToken,
  getRepositoryInfo,
  getRequiredPermissionChanges,
  getWorkflowPermissions
} from './github-setup.js'
import { validateWorkflowSemantics } from './workflow-semantics.js'

// ============================================================================
// ANSI Color Utilities
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Pipecraft brand - magenta/pink
  magenta: '\x1b[35m',
  brightMagenta: '\x1b[95m',

  // Status colors
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
} as const

function color(text: string, ...codes: string[]): string {
  return `${codes.join('')}${text}${COLORS.reset}`
}

// ============================================================================
// Check Result Types
// ============================================================================

export type CheckStatus = 'success' | 'error' | 'warning'

export interface CheckResult {
  status: CheckStatus
  message: string
  fix?: {
    description: string
    command?: string
  }
}

export interface CheckCategory {
  name: string
  results: CheckResult[]
}

export interface DoctorResult {
  categories: CheckCategory[]
  errorCount: number
  warningCount: number
}

// ============================================================================
// Output Formatting
// ============================================================================

function formatStatus(status: CheckStatus): string {
  switch (status) {
    case 'success':
      return color(' ✓ ', COLORS.green)
    case 'error':
      return color(' ✗ ', COLORS.red)
    case 'warning':
      return color(' ! ', COLORS.yellow)
  }
}

function formatCheckLine(result: CheckResult): string {
  const status = formatStatus(result.status)

  switch (result.status) {
    case 'success':
      return `${status} ${color(result.message, COLORS.green)}`
    case 'error':
      return `${status} ${color(result.message, COLORS.red)}`
    case 'warning':
      return `${status} ${color(result.message, COLORS.yellow)}`
  }
}

function formatCategoryHeader(name: string): string {
  return color(name, COLORS.brightMagenta, COLORS.bold)
}

function formatFixCommand(command: string): string {
  return color(command, COLORS.cyan)
}

export function formatDoctorOutput(result: DoctorResult): string {
  const lines: string[] = []

  // Header
  lines.push('')
  lines.push(color('Pipecraft Doctor', COLORS.brightMagenta, COLORS.bold))
  lines.push('')

  // Categories
  for (const category of result.categories) {
    lines.push(formatCategoryHeader(category.name))

    for (const check of category.results) {
      lines.push(formatCheckLine(check))
    }

    lines.push('')
  }

  // Summary line
  lines.push(color('─'.repeat(50), COLORS.gray))

  if (result.errorCount === 0 && result.warningCount === 0) {
    lines.push(color('All checks passed!', COLORS.green, COLORS.bold))
  } else {
    const parts: string[] = []
    if (result.errorCount > 0) {
      parts.push(color(`${result.errorCount} error${result.errorCount > 1 ? 's' : ''}`, COLORS.red))
    }
    if (result.warningCount > 0) {
      parts.push(
        color(`${result.warningCount} warning${result.warningCount > 1 ? 's' : ''}`, COLORS.yellow)
      )
    }
    lines.push(parts.join(', '))
  }

  // Fix suggestions
  const fixes = result.categories
    .flatMap(cat => cat.results)
    .filter(r => r.status !== 'success' && r.fix)

  if (fixes.length > 0) {
    lines.push('')
    lines.push(color('To fix:', COLORS.white, COLORS.bold))
    lines.push('')

    let fixNumber = 1
    for (const fix of fixes) {
      if (fix.fix) {
        lines.push(`  ${color(`${fixNumber}.`, COLORS.white)} ${fix.fix.description}`)
        if (fix.fix.command) {
          lines.push(`     ${formatFixCommand(fix.fix.command)}`)
        }
        lines.push('')
        fixNumber++
      }
    }
  }

  return lines.join('\n')
}

// ============================================================================
// Individual Checks
// ============================================================================

/**
 * Check 1: Configuration validation
 */
export function checkConfiguration(): CheckCategory {
  const results: CheckResult[] = []

  // Check if config file exists and is valid
  try {
    const config = loadConfig()
    results.push({
      status: 'success',
      message: 'Config file found'
    })

    // Validate schema
    try {
      validateConfig(config)
      results.push({
        status: 'success',
        message: 'Config schema valid'
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      results.push({
        status: 'error',
        message: `Config validation failed: ${message}`,
        fix: {
          description: 'Fix the configuration errors in .pipecraftrc',
          command: 'pipecraft validate'
        }
      })
    }
  } catch {
    results.push({
      status: 'error',
      message: 'No config file found',
      fix: {
        description: 'Initialize Pipecraft configuration',
        command: 'pipecraft init'
      }
    })
  }

  return { name: 'Configuration', results }
}

/**
 * Check 2: GitHub workflow permissions
 */
export async function checkGitHubPermissions(): Promise<CheckCategory> {
  const results: CheckResult[] = []

  try {
    // Get repository info
    const repoInfo = getRepositoryInfo()
    results.push({
      status: 'success',
      message: `Repository: ${repoInfo.owner}/${repoInfo.repo}`
    })

    // Get GitHub token
    let token: string
    try {
      token = getGitHubToken()
    } catch {
      results.push({
        status: 'error',
        message: 'GitHub token not found',
        fix: {
          description: 'Authenticate with GitHub CLI',
          command: 'gh auth login'
        }
      })
      return { name: 'GitHub Setup', results }
    }

    // Check workflow permissions
    try {
      const permissions = await getWorkflowPermissions(repoInfo.owner, repoInfo.repo, token)
      const changes = getRequiredPermissionChanges(permissions)

      if (changes === null) {
        results.push({
          status: 'success',
          message: 'Workflow permissions configured correctly'
        })
      } else {
        if (permissions.default_workflow_permissions !== 'write') {
          results.push({
            status: 'error',
            message: 'Workflow permissions are read-only (should be read-write)',
            fix: {
              description: 'Configure GitHub workflow permissions',
              command: 'pipecraft setup-github'
            }
          })
        }
        if (!permissions.can_approve_pull_request_reviews) {
          results.push({
            status: 'error',
            message: 'Cannot create/approve PRs (should be enabled)',
            fix: {
              description: 'Enable PR creation permission',
              command: 'pipecraft setup-github'
            }
          })
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      results.push({
        status: 'warning',
        message: `Could not check permissions: ${message}`
      })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    results.push({
      status: 'error',
      message: `Git remote not configured: ${message}`,
      fix: {
        description: 'Set up git remote origin',
        command: 'git remote add origin <your-repo-url>'
      }
    })
  }

  return { name: 'GitHub Setup', results }
}

/**
 * Check 3: Branches exist on remote
 */
export function checkBranches(): CheckCategory {
  const results: CheckResult[] = []

  try {
    const config = loadConfig() as PipecraftConfig

    if (!config.branchFlow || config.branchFlow.length === 0) {
      results.push({
        status: 'warning',
        message: 'No branches configured in branchFlow'
      })
      return { name: 'Branches', results }
    }

    // Get remote branches
    let remoteBranches: string[]
    try {
      const output = execSync('git ls-remote --heads origin', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore']
      })
      remoteBranches = output
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const match = line.match(/refs\/heads\/(.+)$/)
          return match ? match[1] : ''
        })
        .filter(Boolean)
    } catch {
      results.push({
        status: 'warning',
        message: 'Could not check remote branches (offline or no remote)',
        fix: {
          description: 'Ensure git remote is configured and accessible',
          command: 'git remote -v'
        }
      })
      return { name: 'Branches', results }
    }

    // Check each branch in branchFlow
    for (const branch of config.branchFlow) {
      if (remoteBranches.includes(branch)) {
        results.push({
          status: 'success',
          message: `${branch} exists on origin`
        })
      } else {
        results.push({
          status: 'warning',
          message: `${branch} not found on origin`,
          fix: {
            description: `Push branch "${branch}" to remote`,
            command: `git push -u origin ${branch}`
          }
        })
      }
    }
  } catch {
    results.push({
      status: 'warning',
      message: 'Could not load config to check branches'
    })
  }

  return { name: 'Branches', results }
}

/**
 * Check 4: Required actions exist
 */
export function checkGeneratedFiles(): CheckCategory {
  const results: CheckResult[] = []

  try {
    const config = loadConfig() as PipecraftConfig
    const actionMode = config.actionSourceMode || 'local'

    // Check pipeline.yml exists
    const pipelinePath = join(process.cwd(), '.github/workflows/pipeline.yml')
    if (existsSync(pipelinePath)) {
      results.push({
        status: 'success',
        message: '.github/workflows/pipeline.yml'
      })
    } else {
      results.push({
        status: 'error',
        message: '.github/workflows/pipeline.yml not found',
        fix: {
          description: 'Generate workflow files',
          command: 'pipecraft generate'
        }
      })
    }

    // Check actions only in local mode
    if (actionMode === 'local') {
      const actionsDir = join(process.cwd(), '.github/actions')
      const expectedActions = [
        'calculate-version',
        'create-pr',
        'create-release',
        'create-tag',
        'detect-changes',
        'manage-branch',
        'promote-branch'
      ]

      for (const action of expectedActions) {
        const actionPath = join(actionsDir, action)
        if (existsSync(actionPath)) {
          results.push({
            status: 'success',
            message: `.github/actions/${action}`
          })
        } else {
          results.push({
            status: 'error',
            message: `.github/actions/${action} not found`,
            fix: {
              description: 'Generate missing action',
              command: 'pipecraft generate'
            }
          })
        }
      }
    } else if (actionMode === 'remote') {
      // In remote mode, verify the workflow references remote actions correctly
      const pipelinePath = join(process.cwd(), '.github/workflows/pipeline.yml')
      if (existsSync(pipelinePath)) {
        const pipelineContent = readFileSync(pipelinePath, 'utf8')
        const actionVersion = config.actionVersion || 'main'
        const expectedRemotePattern = `the-craftlab/pipecraft/actions/`

        if (pipelineContent.includes(expectedRemotePattern)) {
          results.push({
            status: 'success',
            message: `Using remote actions (the-craftlab/pipecraft/actions/*@${actionVersion})`
          })
        } else {
          results.push({
            status: 'warning',
            message: `Workflow may not reference remote actions correctly`,
            fix: {
              description: 'Regenerate workflows with remote action mode',
              command: 'pipecraft generate --force'
            }
          })
        }
      }
    } else if (actionMode === 'source') {
      // In source mode (dogfooding), verify actions exist at ./actions/
      const actionsDir = join(process.cwd(), 'actions')
      const expectedActions = [
        'calculate-version',
        'create-pr',
        'create-release',
        'create-tag',
        'detect-changes',
        'manage-branch',
        'promote-branch'
      ]

      for (const action of expectedActions) {
        const actionPath = join(actionsDir, action)
        if (existsSync(actionPath)) {
          results.push({
            status: 'success',
            message: `actions/${action}`
          })
        } else {
          results.push({
            status: 'error',
            message: `actions/${action} not found`,
            fix: {
              description: 'Ensure source actions exist',
              command: undefined
            }
          })
        }
      }
    }
  } catch {
    // Config not found - just check pipeline.yml
    const pipelinePath = join(process.cwd(), '.github/workflows/pipeline.yml')
    if (existsSync(pipelinePath)) {
      results.push({
        status: 'success',
        message: '.github/workflows/pipeline.yml'
      })
    } else {
      results.push({
        status: 'error',
        message: '.github/workflows/pipeline.yml not found',
        fix: {
          description: 'Generate workflow files',
          command: 'pipecraft generate'
        }
      })
    }
  }

  return { name: 'Generated Files', results }
}

/**
 * Check 5: Workflow semantic validation
 */
export function checkWorkflowSemantics(): CheckCategory {
  const results: CheckResult[] = []

  const pipelinePath = join(process.cwd(), '.github/workflows/pipeline.yml')

  if (!existsSync(pipelinePath)) {
    results.push({
      status: 'warning',
      message: 'Cannot validate workflow (pipeline.yml not found)'
    })
    return { name: 'Workflow Validation', results }
  }

  try {
    const yamlContent = readFileSync(pipelinePath, 'utf8')
    const validation = validateWorkflowSemantics(yamlContent)

    if (validation.valid && validation.warnings.length === 0) {
      results.push({
        status: 'success',
        message: 'No circular dependencies'
      })
      results.push({
        status: 'success',
        message: 'All job references valid'
      })
    } else {
      // Report errors
      for (const error of validation.errors) {
        results.push({
          status: 'error',
          message: error.message,
          fix: {
            description: 'Regenerate workflows to fix semantic errors',
            command: 'pipecraft generate --force'
          }
        })
      }

      // Report warnings
      for (const warning of validation.warnings) {
        results.push({
          status: 'warning',
          message: warning.message
        })
      }

      if (validation.errors.length === 0) {
        results.push({
          status: 'success',
          message: 'No circular dependencies'
        })
        results.push({
          status: 'success',
          message: 'All job references valid'
        })
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    results.push({
      status: 'error',
      message: `Failed to parse workflow: ${message}`
    })
  }

  return { name: 'Workflow Validation', results }
}

/**
 * Check 6: Domain paths match files
 */
export async function checkDomainPaths(): Promise<CheckCategory> {
  const results: CheckResult[] = []

  try {
    const config = loadConfig() as PipecraftConfig

    if (!config.domains || Object.keys(config.domains).length === 0) {
      results.push({
        status: 'warning',
        message: 'No domains configured'
      })
      return { name: 'Domain Paths', results }
    }

    for (const [domainName, domainConfig] of Object.entries(config.domains)) {
      if (!domainConfig.paths || domainConfig.paths.length === 0) {
        results.push({
          status: 'warning',
          message: `"${domainName}" has no paths configured`
        })
        continue
      }

      // Check each path pattern
      let totalMatches = 0
      for (const pattern of domainConfig.paths) {
        try {
          const matches = await glob(pattern, {
            cwd: process.cwd(),
            nodir: false,
            ignore: ['node_modules/**', '.git/**']
          })
          totalMatches += matches.length
        } catch {
          // Glob error - continue with other patterns
        }
      }

      if (totalMatches > 0) {
        results.push({
          status: 'success',
          message: `"${domainName}" paths match ${totalMatches} file${totalMatches > 1 ? 's' : ''}`
        })
      } else {
        const pathsStr = domainConfig.paths.join(', ')
        results.push({
          status: 'warning',
          message: `"${domainName}" matches 0 files (${pathsStr})`,
          fix: {
            description: `Check path patterns for "${domainName}" in .pipecraftrc`,
            command: undefined
          }
        })
      }
    }
  } catch {
    results.push({
      status: 'warning',
      message: 'Could not load config to check domain paths'
    })
  }

  return { name: 'Domain Paths', results }
}

// ============================================================================
// Main Doctor Function
// ============================================================================

/**
 * Run all diagnostic checks and return the results.
 */
export async function runDoctor(): Promise<DoctorResult> {
  const categories: CheckCategory[] = []

  // Run all checks
  categories.push(checkConfiguration())
  categories.push(await checkGitHubPermissions())
  categories.push(checkBranches())
  categories.push(checkGeneratedFiles())
  categories.push(checkWorkflowSemantics())
  categories.push(await checkDomainPaths())

  // Count errors and warnings
  let errorCount = 0
  let warningCount = 0

  for (const category of categories) {
    for (const result of category.results) {
      if (result.status === 'error') errorCount++
      if (result.status === 'warning') warningCount++
    }
  }

  return {
    categories,
    errorCount,
    warningCount
  }
}
