import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import {
  installSkills,
  uninstallSkills,
  listSkillTargets,
  SKILL_TARGETS
} from '../../src/utils/skill-installer.js'

describe('skill-installer', () => {
  const testDir = join(tmpdir(), 'pipecraft-skill-test-' + Date.now())

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('SKILL_TARGETS', () => {
    it('should have claude-code target', () => {
      const claudeTarget = SKILL_TARGETS.find(t => t.name === 'claude-code')
      expect(claudeTarget).toBeDefined()
      expect(claudeTarget?.displayName).toBe('Claude Code')
    })

    it('should have cursor target', () => {
      const cursorTarget = SKILL_TARGETS.find(t => t.name === 'cursor')
      expect(cursorTarget).toBeDefined()
      expect(cursorTarget?.displayName).toBe('Cursor')
    })

    it('should have copilot target', () => {
      const copilotTarget = SKILL_TARGETS.find(t => t.name === 'copilot')
      expect(copilotTarget).toBeDefined()
      expect(copilotTarget?.displayName).toBe('GitHub Copilot')
    })

    it('should have windsurf target', () => {
      const windsurfTarget = SKILL_TARGETS.find(t => t.name === 'windsurf')
      expect(windsurfTarget).toBeDefined()
      expect(windsurfTarget?.displayName).toBe('Windsurf')
    })
  })

  describe('listSkillTargets', () => {
    it('should return all targets with status', () => {
      const targets = listSkillTargets()
      expect(targets.length).toBe(SKILL_TARGETS.length)

      for (const target of targets) {
        expect(target).toHaveProperty('name')
        expect(target).toHaveProperty('displayName')
        expect(target).toHaveProperty('installed')
        expect(target).toHaveProperty('globalPath')
        expect(target).toHaveProperty('hasSkill')
      }
    })
  })

  describe('installSkills', () => {
    it('should install to local directory with force flag', () => {
      const localSkillDir = join(testDir, '.claude', 'skills', 'pipecraft')

      const results = installSkills({
        local: true,
        global: false,
        targets: ['claude-code'],
        force: true,
        cwd: testDir
      })

      // Should have attempted installation
      expect(results.length).toBeGreaterThan(0)

      const claudeResult = results.find(r => r.target.includes('Claude'))
      expect(claudeResult).toBeDefined()

      if (claudeResult?.success) {
        // Verify file was created
        const skillPath = join(localSkillDir, 'SKILL.md')
        expect(existsSync(skillPath)).toBe(true)

        // Verify content
        const content = readFileSync(skillPath, 'utf8')
        expect(content).toContain('pipecraft')
        expect(content).toContain('description:')
      }
    })

    it('should skip targets when tool not detected and force is false', () => {
      const results = installSkills({
        local: false,
        global: true,
        targets: ['windsurf'], // Unlikely to be installed
        force: false,
        cwd: testDir
      })

      // Should be skipped if windsurf not detected
      const windsurfResult = results.find(r => r.target.includes('Windsurf'))
      expect(windsurfResult).toBeDefined()

      // Either skipped or succeeded (if windsurf is actually installed)
      expect(windsurfResult?.success || windsurfResult?.skipped).toBe(true)
    })

    it('should filter by target names', () => {
      const results = installSkills({
        local: true,
        global: false,
        targets: ['claude-code'],
        force: true,
        cwd: testDir
      })

      // Should only have Claude Code results
      expect(results.length).toBe(1)
      expect(results[0].target).toContain('Claude')
    })
  })

  describe('uninstallSkills', () => {
    it('should remove installed skills', () => {
      // First install
      const localSkillDir = join(testDir, '.claude', 'skills', 'pipecraft')
      installSkills({
        local: true,
        global: false,
        targets: ['claude-code'],
        force: true,
        cwd: testDir
      })

      // Verify installed
      expect(existsSync(join(localSkillDir, 'SKILL.md'))).toBe(true)

      // Now uninstall
      const results = uninstallSkills({
        local: true,
        global: false,
        cwd: testDir
      })

      // Should report removal
      const claudeResult = results.find(r => r.target.includes('Claude'))
      if (claudeResult) {
        expect(claudeResult.success).toBe(true)
        expect(existsSync(localSkillDir)).toBe(false)
      }
    })
  })
})
