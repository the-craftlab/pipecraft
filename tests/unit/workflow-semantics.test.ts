/**
 * Tests for workflow semantic validation
 */

import { describe, expect, it } from 'vitest'

import {
  validateJobDependencies,
  validateWorkflowSemantics
} from '../../src/utils/workflow-semantics'

describe('Workflow Semantic Validation', () => {
  describe('validateJobDependencies', () => {
    it('should pass for a valid workflow with proper dependencies', () => {
      const workflow = `
name: Valid Workflow
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "build"
  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
  deploy:
    needs: [build, test]
    runs-on: ubuntu-latest
    steps:
      - run: echo "deploy"
`
      const result = validateJobDependencies(workflow)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect circular dependencies', () => {
      const workflow = `
name: Circular Workflow
jobs:
  job-a:
    needs: job-c
    runs-on: ubuntu-latest
    steps:
      - run: echo "a"
  job-b:
    needs: job-a
    runs-on: ubuntu-latest
    steps:
      - run: echo "b"
  job-c:
    needs: job-b
    runs-on: ubuntu-latest
    steps:
      - run: echo "c"
`
      const result = validateJobDependencies(workflow)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'CIRCULAR_DEPENDENCY')).toBe(true)
    })

    it('should detect self-referencing jobs', () => {
      const workflow = `
name: Self Reference
jobs:
  self:
    needs: self
    runs-on: ubuntu-latest
    steps:
      - run: echo "self"
`
      const result = validateJobDependencies(workflow)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'CIRCULAR_DEPENDENCY')).toBe(true)
    })

    it('should detect missing job references', () => {
      const workflow = `
name: Missing Reference
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "build"
  deploy:
    needs: [build, non-existent-job]
    runs-on: ubuntu-latest
    steps:
      - run: echo "deploy"
`
      const result = validateJobDependencies(workflow)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'MISSING_JOB_REFERENCE')).toBe(true)
      expect(result.errors[0].message).toContain('non-existent-job')
    })

    it('should detect invalid output references', () => {
      const workflow = `
name: Invalid Output
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: \${{ steps.version.outputs.value }}
    steps:
      - run: echo "build"
  deploy:
    needs: build
    if: \${{ needs.missing-job.outputs.something != '' }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "deploy"
`
      const result = validateJobDependencies(workflow)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_OUTPUT_REFERENCE')).toBe(true)
      expect(result.errors[0].message).toContain('missing-job')
    })

    it('should warn about unreachable jobs with false conditions', () => {
      const workflow = `
name: Unreachable Job
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "build"
  never-runs:
    if: false
    runs-on: ubuntu-latest
    steps:
      - run: echo "never"
`
      const result = validateJobDependencies(workflow)
      expect(result.valid).toBe(true) // Warnings don't fail validation
      expect(result.warnings.some(w => w.code === 'UNREACHABLE_JOB')).toBe(true)
    })

    it('should handle string needs (single dependency)', () => {
      const workflow = `
name: String Needs
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "build"
  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
`
      const result = validateJobDependencies(workflow)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle workflow with no jobs', () => {
      const workflow = `
name: Empty Workflow
on: push
`
      const result = validateJobDependencies(workflow)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle invalid YAML gracefully', () => {
      const invalidYaml = `
name: Invalid
jobs:
  build:
    - this is not valid yaml for a job
    invalid: [
`
      const result = validateJobDependencies(invalidYaml)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.code === 'PARSE_ERROR')).toBe(true)
    })
  })

  describe('validateWorkflowSemantics', () => {
    it('should validate a typical Pipecraft workflow', () => {
      const workflow = `
name: Pipeline
on:
  push:
    branches: [develop, main]
jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      affected: \${{ steps.detect.outputs.affected }}
    steps:
      - uses: actions/checkout@v4
      - id: detect
        run: echo "affected=true" >> $GITHUB_OUTPUT
  version:
    needs: changes
    runs-on: ubuntu-latest
    outputs:
      version: \${{ steps.calc.outputs.version }}
    steps:
      - id: calc
        run: echo "version=1.0.0" >> $GITHUB_OUTPUT
  test:
    needs: [changes, version]
    if: \${{ needs.changes.outputs.affected == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - run: npm test
  gate:
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - run: echo "All tests passed"
  tag:
    needs: [version, gate]
    if: \${{ needs.version.outputs.version != '' }}
    runs-on: ubuntu-latest
    steps:
      - run: git tag v\${{ needs.version.outputs.version }}
`
      const result = validateWorkflowSemantics(workflow)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should catch gate job referencing non-existent test job', () => {
      const workflow = `
name: Invalid Gate
jobs:
  changes:
    runs-on: ubuntu-latest
    steps:
      - run: echo "changes"
  gate:
    needs: [changes, test-api, test-web]
    runs-on: ubuntu-latest
    steps:
      - run: echo "gate"
`
      const result = validateWorkflowSemantics(workflow)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].message).toContain('test-api')
      expect(result.errors[1].message).toContain('test-web')
    })
  })
})
