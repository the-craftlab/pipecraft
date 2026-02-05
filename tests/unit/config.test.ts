import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { loadConfig, validateConfig } from '../../src/utils/config'
import { FIXTURES_DIR } from '../setup'

describe('Config Utilities', () => {

  describe('loadConfig', () => {
    it('should load valid configuration from .pipecraftrc', () => {
      // Use a unique temp directory to avoid race conditions with parallel tests
      const uniqueTempDir = join(
        tmpdir(),
        `pipecraft-config-test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      )
      mkdirSync(uniqueTempDir, { recursive: true })

      const configPath = join(FIXTURES_DIR, 'basic-config.json')
      const configContent = readFileSync(configPath, 'utf8')
      const testConfigPath = join(uniqueTempDir, '.pipecraftrc')
      writeFileSync(testConfigPath, configContent)

      // Change to unique temp dir so cosmiconfig can find the config file
      const originalCwd = process.cwd()
      try {
        process.chdir(uniqueTempDir)
        const config = loadConfig()

        expect(config).toBeDefined()
        expect(config.ciProvider).toBe('github')
        expect(config.mergeStrategy).toBe('fast-forward')
        expect(config.domains).toHaveProperty('api')
        expect(config.domains).toHaveProperty('web')
      } finally {
        process.chdir(originalCwd)
        rmSync(uniqueTempDir, { recursive: true, force: true })
      }
    })

    it('should throw error when no config file found', () => {
      // Use a unique temp directory to avoid race conditions
      const uniqueTempDir = join(tmpdir(), `pipecraft-config-test-${Date.now()}`)
      mkdirSync(uniqueTempDir, { recursive: true })

      // Change to temp directory, run test, then restore
      const originalCwd = process.cwd()
      try {
        process.chdir(uniqueTempDir)
        expect(() => loadConfig()).toThrow('No configuration file found')
      } finally {
        process.chdir(originalCwd)
        rmSync(uniqueTempDir, { recursive: true, force: true })
      }
    })

    it('should load config from custom path', () => {
      // Use a unique temp directory to avoid race conditions with parallel tests
      const uniqueTempDir = join(
        tmpdir(),
        `pipecraft-config-test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      )
      mkdirSync(uniqueTempDir, { recursive: true })

      const configPath = join(FIXTURES_DIR, 'basic-config.json')
      const configContent = readFileSync(configPath, 'utf8')
      const customPath = join(uniqueTempDir, 'custom-config.json')

      try {
        writeFileSync(customPath, configContent)
        const config = loadConfig(customPath)

        expect(config).toBeDefined()
        expect(config.ciProvider).toBe('github')
      } finally {
        rmSync(uniqueTempDir, { recursive: true, force: true })
      }
    })

    it('should load valid configuration from .pipecraftrc.json', () => {
      const uniqueTempDir = join(
        tmpdir(),
        `pipecraft-config-test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      )
      mkdirSync(uniqueTempDir, { recursive: true })

      const configPath = join(FIXTURES_DIR, 'basic-config.json')
      const configContent = readFileSync(configPath, 'utf8')
      const testConfigPath = join(uniqueTempDir, '.pipecraftrc.json')
      writeFileSync(testConfigPath, configContent)

      const originalCwd = process.cwd()
      try {
        process.chdir(uniqueTempDir)
        const config = loadConfig()

        expect(config).toBeDefined()
        expect(config.ciProvider).toBe('github')
        expect(config.mergeStrategy).toBe('fast-forward')
        expect(config.domains).toHaveProperty('api')
        expect(config.domains).toHaveProperty('web')
      } finally {
        process.chdir(originalCwd)
        rmSync(uniqueTempDir, { recursive: true, force: true })
      }
    })

    it('should load valid configuration from .pipecraftrc.yml', () => {
      const uniqueTempDir = join(
        tmpdir(),
        `pipecraft-config-test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      )
      mkdirSync(uniqueTempDir, { recursive: true })

      const configPath = join(FIXTURES_DIR, 'basic-config.yml')
      const configContent = readFileSync(configPath, 'utf8')
      const testConfigPath = join(uniqueTempDir, '.pipecraftrc.yml')
      writeFileSync(testConfigPath, configContent)

      const originalCwd = process.cwd()
      try {
        process.chdir(uniqueTempDir)
        const config = loadConfig()

        expect(config).toBeDefined()
        expect(config.ciProvider).toBe('github')
        expect(config.mergeStrategy).toBe('fast-forward')
        expect(config.domains).toHaveProperty('api')
        expect(config.domains).toHaveProperty('web')
      } finally {
        process.chdir(originalCwd)
        rmSync(uniqueTempDir, { recursive: true, force: true })
      }
    })

    it('should load valid configuration from .pipecraftrc.yaml', () => {
      const uniqueTempDir = join(
        tmpdir(),
        `pipecraft-config-test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      )
      mkdirSync(uniqueTempDir, { recursive: true })

      const configPath = join(FIXTURES_DIR, 'basic-config.yml')
      const configContent = readFileSync(configPath, 'utf8')
      const testConfigPath = join(uniqueTempDir, '.pipecraftrc.yaml')
      writeFileSync(testConfigPath, configContent)

      const originalCwd = process.cwd()
      try {
        process.chdir(uniqueTempDir)
        const config = loadConfig()

        expect(config).toBeDefined()
        expect(config.ciProvider).toBe('github')
        expect(config.mergeStrategy).toBe('fast-forward')
        expect(config.domains).toHaveProperty('api')
        expect(config.domains).toHaveProperty('web')
      } finally {
        process.chdir(originalCwd)
        rmSync(uniqueTempDir, { recursive: true, force: true })
      }
    })

    it('should load valid configuration from .pipecraftrc.js', () => {
      const uniqueTempDir = join(
        tmpdir(),
        `pipecraft-config-test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      )
      mkdirSync(uniqueTempDir, { recursive: true })

      const configPath = join(FIXTURES_DIR, 'basic-config.js')
      const configContent = readFileSync(configPath, 'utf8')
      const testConfigPath = join(uniqueTempDir, '.pipecraftrc.js')
      writeFileSync(testConfigPath, configContent)

      const originalCwd = process.cwd()
      try {
        process.chdir(uniqueTempDir)
        const config = loadConfig()

        expect(config).toBeDefined()
        expect(config.ciProvider).toBe('github')
        expect(config.mergeStrategy).toBe('fast-forward')
        expect(config.domains).toHaveProperty('api')
        expect(config.domains).toHaveProperty('web')
      } finally {
        process.chdir(originalCwd)
        rmSync(uniqueTempDir, { recursive: true, force: true })
      }
    })
  })

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const configPath = join(FIXTURES_DIR, 'basic-config.json')
      const configContent = readFileSync(configPath, 'utf8')
      const config = JSON.parse(configContent)

      expect(() => validateConfig(config)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const config = { ciProvider: 'github' }

      expect(() => validateConfig(config)).toThrow('Missing required field: mergeStrategy')
    })

    it('should throw error for invalid ciProvider', () => {
      const config = {
        ciProvider: 'invalid',
        mergeStrategy: 'fast-forward',
        requireConventionalCommits: true,
        initialBranch: 'develop',
        finalBranch: 'main',
        branchFlow: ['develop', 'main'],
        domains: { api: { paths: ['apps/api/**'], description: 'API' } }
      }

      expect(() => validateConfig(config)).toThrow('ciProvider must be either "github" or "gitlab"')
    })

    it('should throw error for invalid mergeStrategy', () => {
      const config = {
        ciProvider: 'github',
        mergeStrategy: 'invalid',
        requireConventionalCommits: true,
        initialBranch: 'develop',
        finalBranch: 'main',
        branchFlow: ['develop', 'main'],
        domains: { api: { paths: ['apps/api/**'], description: 'API' } }
      }

      expect(() => validateConfig(config)).toThrow(
        'mergeStrategy must be either "fast-forward" or "merge"'
      )
    })

    it('should allow single-branch workflows', () => {
      const config = {
        ciProvider: 'github',
        mergeStrategy: 'fast-forward',
        requireConventionalCommits: true,
        initialBranch: 'main',
        finalBranch: 'main',
        branchFlow: ['main'], // Single branch workflow
        domains: { api: { paths: ['apps/api/**'], description: 'API' } }
      }

      // Single-branch workflows are now supported (PR #293)
      expect(() => validateConfig(config)).not.toThrow()
    })

    it('should throw error for invalid domains', () => {
      const config = {
        ciProvider: 'github',
        mergeStrategy: 'fast-forward',
        requireConventionalCommits: true,
        initialBranch: 'develop',
        finalBranch: 'main',
        branchFlow: ['develop', 'main'],
        domains: {
          api: {
            paths: [], // Empty paths
            description: 'API'
          }
        }
      }

      expect(() => validateConfig(config)).toThrow(
        'Domain "api" must have at least one path pattern'
      )
    })

    it('should throw error when domain name conflicts with reserved job names', () => {
      const reservedNames = ['version', 'changes', 'gate', 'tag', 'promote', 'release']

      for (const reservedName of reservedNames) {
        const config = {
          ciProvider: 'github',
          mergeStrategy: 'fast-forward',
          requireConventionalCommits: true,
          initialBranch: 'develop',
          finalBranch: 'main',
          branchFlow: ['develop', 'main'],
          domains: {
            [reservedName]: { paths: ['apps/**'], description: 'Test domain' }
          }
        }

        expect(() => validateConfig(config)).toThrow(
          `Domain name "${reservedName}" is reserved and cannot be used`
        )
      }
    })

    it('should throw error when domain name conflicts with reserved names (case insensitive)', () => {
      const config = {
        ciProvider: 'github',
        mergeStrategy: 'fast-forward',
        requireConventionalCommits: true,
        initialBranch: 'develop',
        finalBranch: 'main',
        branchFlow: ['develop', 'main'],
        domains: {
          Version: { paths: ['apps/**'], description: 'Test domain' }
        }
      }

      expect(() => validateConfig(config)).toThrow(
        `Domain name "Version" is reserved and cannot be used`
      )
    })

    it('should throw error when initialBranch is not first in branchFlow', () => {
      const config = {
        ciProvider: 'github',
        mergeStrategy: 'fast-forward',
        requireConventionalCommits: true,
        initialBranch: 'staging',
        finalBranch: 'main',
        branchFlow: ['develop', 'staging', 'main'],
        domains: { api: { paths: ['apps/api/**'], description: 'API' } }
      }

      expect(() => validateConfig(config)).toThrow(
        'initialBranch "staging" must be the first branch in branchFlow'
      )
    })

    it('should throw error when finalBranch is not last in branchFlow', () => {
      const config = {
        ciProvider: 'github',
        mergeStrategy: 'fast-forward',
        requireConventionalCommits: true,
        initialBranch: 'develop',
        finalBranch: 'staging',
        branchFlow: ['develop', 'staging', 'main'],
        domains: { api: { paths: ['apps/api/**'], description: 'API' } }
      }

      expect(() => validateConfig(config)).toThrow(
        'finalBranch "staging" must be the last branch in branchFlow'
      )
    })

    it('should accept valid 3-branch flow configuration', () => {
      const config = {
        ciProvider: 'github',
        mergeStrategy: 'fast-forward',
        requireConventionalCommits: true,
        initialBranch: 'develop',
        finalBranch: 'main',
        branchFlow: ['develop', 'staging', 'main'],
        domains: { api: { paths: ['apps/api/**'], description: 'API' } }
      }

      expect(() => validateConfig(config)).not.toThrow()
    })
  })
})
