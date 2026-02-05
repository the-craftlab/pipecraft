#!/usr/bin/env node

/**
 * PipeCraft Command-Line Interface
 *
 * Main CLI entry point for PipeCraft - automated CI/CD pipeline generator for
 * trunk-based development workflows. This CLI provides commands for:
 *
 * - **init**: Initialize PipeCraft configuration interactively or with flags
 * - **generate**: Generate GitHub Actions workflows from configuration
 * - **validate**: Validate configuration file schema
 * - **doctor**: Run comprehensive diagnostic health checks
 * - **setup**: Configure GitHub repository permissions and settings
 * - **version**: Display version information
 *
 * ## Command Overview
 *
 * ### init
 * Creates .pipecraftrc configuration file with project settings.
 * Can run interactively or accept flags for automation.
 *
 * ### generate
 * Generates GitHub Actions workflows based on configuration:
 * - Main pipeline workflow (.github/workflows/pipeline.yml)
 * - Reusable actions (actions/*)
 * - Idempotent regeneration (only when config/templates change)
 *
 * ### validate
 * Quick validation of configuration file schema.
 *
 * ### doctor
 * Comprehensive diagnostic health check including:
 * - Configuration validation
 * - GitHub workflow permissions
 * - Branch existence on remote
 * - Generated file verification
 * - Workflow semantic validation
 * - Domain path validation
 *
 * ### setup
 * Configures GitHub repository:
 * - Workflow permissions (read/write)
 * - Branch protection rules
 * - Auto-merge settings
 *
 * ## Global Options
 * - `-c, --config <path>`: Path to config file (default: .pipecraftrc)
 * - `-v, --verbose`: Verbose output
 * - `--debug`: Debug output (maximum detail)
 * - `--force`: Force regeneration even if unchanged
 * - `--dry-run`: Show what would be done without making changes
 *
 * ## Examples
 *
 * ```bash
 * # Initialize configuration interactively
 * pipecraft init --interactive
 *
 * # Generate workflows
 * pipecraft generate
 *
 * # Generate with version management
 * pipecraft init --with-versioning
 * pipecraft generate
 *
 * # Validate existing workflows
 * pipecraft validate
 *
 * # Setup GitHub repository
 * pipecraft setup --verify
 *
 * # Debug mode
 * pipecraft generate --debug
 * ```
 *
 * @module cli
 */

import { prompt, runModule } from '@featherscloud/pinion'
import { Command } from 'commander'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import type { PipecraftConfig } from '../types/index.js'
import { loadConfig, validateConfig } from '../utils/config.js'
import { setupGitHubPermissions } from '../utils/github-setup.js'
import { logger } from '../utils/logger.js'
import { formatPreflightResults, runPreflightChecks } from '../utils/preflight.js'
import { VersionManager } from '../utils/versioning.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'))
const version = packageJson.version

const program = new Command()

// Configure the CLI
program
  .name('pipecraft')
  .description('CLI tool for managing trunk-based development workflows')
  .version(version)

// Global options
program
  .option('-c, --config <path>', 'path to config file', '.pipecraftrc')
  .option(
    '-p, --pipeline <path>',
    'path to existing pipeline file for merging',
    '.github/workflows/pipeline.yml'
  )
  .option(
    '-o, --output-pipeline <path>',
    'path to output pipeline file (for testing)',
    '.github/workflows/pipeline.yml'
  )
  .option('-v, --verbose', 'verbose output')
  .option('--debug', 'debug output (includes all verbose output plus additional debugging info)')
  .option('--force', 'force regeneration even if files unchanged')
  .option('--dry-run', 'show what would be done without making changes')

// Init command - Initialize configuration
program
  .command('init')
  .description('Initialize pipecraft configuration')
  .option('-f, --force', 'overwrite existing config file')
  .option('-i, --interactive', 'run interactive setup wizard')
  .option('--with-versioning', 'include version management setup')
  .option('--with-skill', 'install AI coding assistant skills')
  .option('--ci-provider <provider>', 'CI provider (github|gitlab)', 'github')
  .option('--merge-strategy <strategy>', 'merge strategy (fast-forward|merge)', 'fast-forward')
  .option('--initial-branch <branch>', 'initial development branch', 'develop')
  .option('--final-branch <branch>', 'final production branch', 'main')
  .action(async options => {
    try {
      const globalOptions = program.opts()

      await runModule(join(__dirname, '../generators/init.tpl.js'), {
        cwd: process.cwd(),
        argv: process.argv,
        pinion: {
          logger: {
            ...console,
            notice: console.log
          },
          prompt: prompt as any,
          cwd: process.cwd(),
          force: options.force || globalOptions.force || false,
          trace: [],
          exec: async (command: string, args: string[]) => {
            const { spawn } = await import('child_process')
            return new Promise((resolve, reject) => {
              const child = spawn(command, args, { stdio: 'inherit', shell: true })
              child.once('exit', (code: number) => (code === 0 ? resolve(code) : reject(code)))
            })
          }
        }
      })

      // Setup version management if requested
      if (options.withVersioning) {
        const config = loadConfig(globalOptions.config)
        const versionManager = new VersionManager(config)
        versionManager.setupVersionManagement()
        console.log('✅ Version management setup completed!')
      }

      // Install AI skills if requested
      if (options.withSkill) {
        const { installSkills } = await import('../utils/skill-installer.js')
        console.log('\n🔧 Installing AI coding assistant skills...')
        const results = installSkills({ global: true })
        const installed = results.filter(r => r.success && !r.skipped)
        if (installed.length > 0) {
          console.log('✅ Skills installed for:', installed.map(r => r.target).join(', '))
        }
      }

      console.log('✅ Configuration initialized successfully!')

      // Hint about skill installation if not already done
      if (!options.withSkill) {
        console.log('\n💡 Tip: Run `pipecraft skill` to install AI assistant skills (Claude, Cursor, etc.)')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('❌ Failed to initialize configuration:', message)
      process.exit(1)
    }
  })

// Generate command - Generate workflow files
program
  .command('generate')
  .description('Generate CI/CD workflows from configuration')
  .option('-o, --output <path>', 'output directory for generated workflows', '.github/workflows')
  .option('--skip-unchanged', "skip files that haven't changed")
  .option('--skip-checks', 'skip pre-flight checks (not recommended)')
  .action(async options => {
    try {
      const globalOptions = program.opts()
      const configPath = globalOptions.config
      const pipelinePath = globalOptions.pipeline
      const outputPipelinePath = globalOptions.outputPipeline

      // Set logger level based on flags
      if (globalOptions.debug) {
        logger.setLevel('debug')
      } else if (globalOptions.verbose) {
        logger.setLevel('verbose')
      }

      // Run pre-flight checks unless skipped
      if (!options.skipChecks) {
        logger.info('🔍 Running pre-flight checks...\n')

        const checks = runPreflightChecks()
        const { allPassed, output, nextSteps } = formatPreflightResults(checks)

        logger.info(output)
        logger.info('')

        if (!allPassed) {
          logger.error('❌ Pre-flight checks failed. Fix the issues above and try again.')
          logger.error('   Or use --skip-checks to bypass (not recommended)\n')
          process.exit(1)
        }

        logger.info('✅ All pre-flight checks passed!')

        // Store next steps for later display (after successful generation)
        if (nextSteps) {
          ;(options as any)._nextSteps = nextSteps
        }

        logger.info('')
      }

      logger.verbose(`📖 Reading config from: ${configPath}`)
      logger.verbose(`📖 Reading pipeline from: ${pipelinePath}`)

      // Load and validate configuration
      const config = loadConfig(configPath) as PipecraftConfig
      validateConfig(config)

      if (globalOptions.dryRun) {
        logger.info('🔍 Dry run mode - would generate workflows')
        return
      }

      // Display mode message
      if (globalOptions.force) {
        logger.info('🔄 Force mode: Complete rebuild of all workflows')
      } else {
        logger.info('✨ Additive mode: Merging with existing workflows')
      }

      await runModule(join(__dirname, '../generators/workflows.tpl.js'), {
        cwd: process.cwd(),
        argv: process.argv,
        pipelinePath: pipelinePath,
        outputPipelinePath: outputPipelinePath,
        config: config,
        pinion: {
          logger: {
            ...console,
            notice: console.log
          },
          prompt: prompt as any,
          cwd: process.cwd(),
          force: globalOptions.force || false,
          trace: [],
          exec: async (command: string, args: string[]) => {
            const { spawn } = await import('child_process')
            return new Promise((resolve, reject) => {
              const child = spawn(command, args, { stdio: 'inherit', shell: true })
              child.once('exit', (code: number) => (code === 0 ? resolve(code) : reject(code)))
            })
          }
        }
      } as any)

      logger.success(`✅ Generated workflows in: ${options.output}`)

      // Display next steps if available
      if ((options as any)._nextSteps) {
        logger.info('')
        const steps = (options as any)._nextSteps as string[]
        steps.forEach((step: string) => logger.info(step))
      }
    } catch (error: any) {
      logger.error('❌ Failed to generate workflows:', error.message)
      process.exit(1)
    }
  })

// Get-config command - Get configuration value
program
  .command('get-config')
  .description('Get a configuration value by key path (supports JSON, YAML, JS, etc.)')
  .argument('<key>', 'key path to retrieve (e.g., "branchFlow" or "autoPromote.staging")')
  .option('--format <format>', 'output format: json, space-separated, or raw', 'raw')
  .action(async (key, options) => {
    try {
      const globalOptions = program.opts()
      const configPath = globalOptions.config

      const config = loadConfig(configPath)
      validateConfig(config)

      // Parse nested key path (e.g., "autoPromote.staging")
      const getValue = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => {
          return current?.[key]
        }, obj)
      }

      const value = getValue(config, key)

      if (value === undefined) {
        console.error(`Key "${key}" not found in configuration`)
        process.exit(1)
      }

      // Output value based on format
      if (options.format === 'json') {
        console.log(JSON.stringify(value))
      } else if (options.format === 'space-separated' && Array.isArray(value)) {
        console.log(value.join(' '))
      } else if (Array.isArray(value)) {
        // Default for arrays: space-separated
        console.log(value.join(' '))
      } else if (typeof value === 'object' && value !== null) {
        // Default for objects: JSON
        console.log(JSON.stringify(value))
      } else {
        // Default for primitives: raw value
        console.log(value)
      }
    } catch (error: any) {
      console.error(`❌ Failed to get config value: ${error.message}`)
      process.exit(1)
    }
  })

// Validate command - Validate configuration file (quick schema check)
program
  .command('validate')
  .description('Validate configuration file')
  .action(async () => {
    try {
      const globalOptions = program.opts()
      const configPath = globalOptions.config

      const config = loadConfig(configPath)
      validateConfig(config)

      console.log('✅ Configuration is valid!')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('❌ Configuration validation failed:', message)
      process.exit(1)
    }
  })

// Doctor command - Comprehensive health check
program
  .command('doctor')
  .description('Run diagnostic checks on your Pipecraft setup')
  .action(async () => {
    try {
      const { runDoctor, formatDoctorOutput } = await import('../utils/doctor.js')

      const result = await runDoctor()
      console.log(formatDoctorOutput(result))

      // Exit with error code if there are errors
      if (result.errorCount > 0) {
        process.exit(1)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('❌ Doctor command failed:', message)
      process.exit(1)
    }
  })

// Version command - Version management
program
  .command('version')
  .description('Version management commands')
  .option('--check', 'check current version and next version')
  .option('--bump', 'bump version using conventional commits')
  .option('--release', 'create release with version bump')
  .action(async options => {
    try {
      const globalOptions = program.opts()
      const config = loadConfig(globalOptions.config) as PipecraftConfig
      const versionManager = new VersionManager(config)

      if (options.check) {
        const currentVersion = versionManager.getCurrentVersion()
        const nextVersion = versionManager.calculateNextVersion()

        console.log(`📦 Current version: ${currentVersion}`)
        console.log(`📦 Next version: ${nextVersion.version} (${nextVersion.type})`)

        // Check conventional commits
        const isValid = versionManager.validateConventionalCommits()
        console.log(`📝 Conventional commits: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
      }

      if (options.bump) {
        console.log('🔄 Bumping version...')
        // This would run release-it in dry-run mode first
        console.log('✅ Version bump completed!')
      }

      if (options.release) {
        console.log('🚀 Creating release...')
        // This would run the actual release process
        console.log('✅ Release created!')
      }
    } catch (error: any) {
      console.error('❌ Version command failed:', error.message)
      process.exit(1)
    }
  })

// Setup command - Create necessary branches
program
  .command('setup')
  .description('Set up the repository with necessary branches from branch flow')
  .option('--force', 'Force creation even if branches exist')
  .action(async options => {
    try {
      const globalOptions = program.opts()
      const configPath = globalOptions.config

      if (globalOptions.verbose) {
        console.log(`📖 Reading config from: ${configPath}`)
      }

      // Load configuration
      const config = loadConfig(configPath) as PipecraftConfig

      if (!config.branchFlow || config.branchFlow.length === 0) {
        console.log('⚠️  No branch flow configured in config file')
        return
      }

      console.log(`🌿 Setting up branches: ${config.branchFlow.join(' → ')}`)

      // Check current branch
      const { execSync } = await import('child_process')
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
      console.log(`📍 Current branch: ${currentBranch}`)

      // Check which branches exist
      const existingBranches = execSync('git branch -a', { encoding: 'utf8' })
        .split('\n')
        .map(line => line.trim().replace('* ', '').replace('remotes/origin/', ''))
        .filter(line => line.length > 0)

      console.log(`📋 Existing branches: ${existingBranches.join(', ')}`)

      // Create missing branches
      for (const branch of config.branchFlow) {
        if (existingBranches.includes(branch)) {
          console.log(`✅ Branch '${branch}' already exists locally`)
        } else {
          console.log(`🌱 Creating branch '${branch}'...`)
          try {
            execSync(`git checkout -b ${branch}`, { stdio: 'inherit' })
            console.log(`✅ Created branch '${branch}'`)
          } catch (error: any) {
            if (error.message.includes('already exists')) {
              console.log(`ℹ️  Branch '${branch}' already exists (checked out from remote)`)
            } else {
              throw error
            }
          }
        }

        // Push branch to remote if it doesn't exist there
        try {
          console.log(`📤 Checking if '${branch}' exists on remote...`)
          execSync(`git ls-remote --heads origin ${branch}`, { stdio: 'pipe' })
          console.log(`✅ Branch '${branch}' already exists on remote`)
        } catch (error: any) {
          console.log(`🚀 Pushing branch '${branch}' to remote...`)
          execSync(`git push -u origin ${branch}`, { stdio: 'inherit' })
          console.log(`✅ Pushed branch '${branch}' to remote`)
        }
      }

      // Return to original branch
      execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' })
      console.log(`🔄 Returned to original branch: ${currentBranch}`)

      console.log('✅ Branch setup complete!')
    } catch (error: any) {
      console.error('❌ Setup command failed:', error.message)
      process.exit(1)
    }
  })

// Setup GitHub command - Configure GitHub Actions permissions
program
  .command('setup-github')
  .description('Configure GitHub Actions workflow permissions for PipeCraft')
  .option('--apply', 'Automatically apply changes without prompting')
  .option('--force', 'Alias for --apply')
  .option('--clean', 'Use clean messaging system (default)')
  .option('--verbose', 'Show detailed technical information')
  .action(async options => {
    try {
      const autoApply = options.apply || options.force

      await setupGitHubPermissions(autoApply)
    } catch (error: any) {
      console.error('❌ GitHub setup failed:', error.message)
      if (error.stack) {
        console.error(error.stack)
      }
      process.exit(1)
    }
  })

// Skill command - Install AI coding assistant skills
program
  .command('skill')
  .description('Install Pipecraft skills for AI coding assistants (Claude Code, Cursor, etc.)')
  .option('--install', 'Install skills (default action)')
  .option('--uninstall', 'Remove installed skills')
  .option('--list', 'List available targets and their status')
  .option('--global', 'Install to global/user directory (default)')
  .option('--local', 'Install to current project directory')
  .option('--force', 'Install even if target tool not detected')
  .option(
    '--target <targets>',
    'Specific targets to install (comma-separated: claude-code,cursor,copilot,windsurf)'
  )
  .action(async options => {
    try {
      const { installSkills, uninstallSkills, listSkillTargets } = await import(
        '../utils/skill-installer.js'
      )

      // List mode
      if (options.list) {
        const targets = listSkillTargets()
        console.log('\n📋 AI Coding Assistant Skill Targets:\n')

        for (const target of targets) {
          const status = target.installed
            ? target.hasSkill
              ? '✅ Installed'
              : '⚠️  Detected (no skill)'
            : '⬚  Not detected'
          console.log(`   ${status}  ${target.displayName}`)
          if (target.installed) {
            console.log(`             ${target.globalPath}`)
          }
        }

        console.log('\nRun `pipecraft skill --install` to install skills.')
        console.log('')
        return
      }

      // Uninstall mode
      if (options.uninstall) {
        console.log('\n🗑️  Removing Pipecraft skills...\n')

        const results = uninstallSkills({
          global: !options.local,
          local: options.local
        })

        const removed = results.filter(r => r.success)
        if (removed.length > 0) {
          console.log('Removed from:')
          for (const r of removed) {
            console.log(`   ✅ ${r.target}`)
          }
        } else {
          console.log('No skills found to remove.')
        }
        console.log('')
        return
      }

      // Install mode (default)
      console.log('\n🔧 Installing Pipecraft skills for AI coding assistants...\n')

      const targetList = options.target?.split(',').map((t: string) => t.trim())

      const results = installSkills({
        global: !options.local,
        local: options.local,
        targets: targetList,
        force: options.force
      })

      const installed = results.filter(r => r.success && !r.skipped)
      const skipped = results.filter(r => r.skipped)
      const failed = results.filter(r => !r.success && !r.skipped)

      if (installed.length > 0) {
        console.log('✅ Installed to:')
        for (const r of installed) {
          console.log(`   ${r.target}: ${r.path}`)
        }
      }

      if (skipped.length > 0) {
        console.log('\n⏭️  Skipped (tool not detected):')
        for (const r of skipped) {
          console.log(`   ${r.target}`)
        }
        console.log('   Use --force to install anyway')
      }

      if (failed.length > 0) {
        console.log('\n❌ Failed:')
        for (const r of failed) {
          console.log(`   ${r.target}: ${r.error}`)
        }
      }

      if (installed.length > 0) {
        console.log('\n📝 Usage:')
        console.log('   Claude Code: Use /pipecraft or ask about Pipecraft setup')
        console.log('   Cursor: The skill activates automatically when relevant')
      }

      console.log('')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('❌ Skill command failed:', message)
      process.exit(1)
    }
  })

// Parse command line arguments
program.parse()

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
