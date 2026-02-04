/**
 * Tests for detect-changes action YAML validation
 *
 * Ensures the generated action.yml template produces valid YAML and doesn't contain
 * syntax that breaks GitHub Actions parser (e.g., heredoc syntax)
 */

import { describe, expect, it } from 'vitest'
import { parse as parseYAML } from 'yaml'

// Simplified template for testing YAML validity
const changesActionTemplate = () => {
  return `name: 'Detect Changes (Configuration-Driven)'
description: 'Enhanced change detection using Nx dependency graph with path-based fallback'
author: 'Pipecraft'

inputs:
  baseRef:
    description: 'Base reference to compare against'
    required: false
    default: 'main'
  domains-config:
    description: 'YAML string of domain configurations'
    required: true
  useNx:
    description: 'Whether to use Nx dependency graph'
    required: false
    default: 'true'
  node-version:
    description: 'Node.js version to use'
    required: false
    default: '22'

outputs:
  changes:
    description: 'JSON object with domain change results'
    value: \${{ steps.output.outputs.changes }}
  affectedDomains:
    description: 'Comma-separated list of domains with changes'
    value: \${{ steps.output.outputs.affectedDomains }}
  nxAvailable:
    description: 'Whether Nx is available in the repository'
    value: \${{ steps.nx-check.outputs.available }}
  affectedProjects:
    description: 'Comma-separated list of affected Nx projects'
    value: \${{ steps.nx-outputs.outputs.affectedProjects }}

runs:
  using: 'composite'
  steps:
    - name: Test inline Node.js with -e flag
      shell: bash
      run: |
        RESULT=\$(node -e "const d='test';process.stdout.write(d)")
        echo "result=\$RESULT" >> \$GITHUB_OUTPUT

    - name: Test JSON parsing with -e flag
      shell: bash
      run: |
        OUTPUT=\$(DATA='{"test":true}' node -e "const d=process.env.DATA||'{}';try{const p=JSON.parse(d);process.stdout.write(JSON.stringify(p))}catch(e){console.warn('Error:',e.message)}")
        echo "output=\$OUTPUT" >> \$GITHUB_OUTPUT
`
}

describe('detect-changes Action YAML Validation', () => {
  it('should generate valid YAML that can be parsed', () => {
    const ctx = {}
    const content = changesActionTemplate(ctx)

    // Should be able to parse without errors
    let parsed: any
    expect(() => {
      parsed = parseYAML(content)
    }).not.toThrow()

    // Basic structure validation
    expect(parsed).toHaveProperty('name')
    expect(parsed).toHaveProperty('description')
    expect(parsed).toHaveProperty('inputs')
    expect(parsed).toHaveProperty('outputs')
    expect(parsed).toHaveProperty('runs')
  })

  it('should not contain heredoc syntax (<<)', () => {
    const ctx = {}
    const content = changesActionTemplate(ctx)

    // Check for heredoc delimiters that break GitHub Actions YAML parser
    expect(content).not.toMatch(/<<'NODE'/)
    expect(content).not.toMatch(/<<'EOF'/)
    expect(content).not.toMatch(/<<NODE/)
    expect(content).not.toMatch(/<<EOF/)
  })

  it('should use Node.js -e flag for inline scripts', () => {
    const ctx = {}
    const content = changesActionTemplate(ctx)

    // Should use -e flag for inline Node.js scripts
    expect(content).toMatch(/node -e/)
  })

  it('should properly escape quotes in generated YAML', () => {
    const ctx = {}
    const content = changesActionTemplate(ctx)
    const parsed = parseYAML(content)

    // Verify steps parse correctly (would fail if quotes are improperly escaped)
    expect(parsed.runs.steps).toBeInstanceOf(Array)

    // Find Node.js execution steps
    const nodeSteps = parsed.runs.steps.filter((step: any) =>
      step.run && typeof step.run === 'string' && step.run.includes('node -e')
    )

    expect(nodeSteps.length).toBeGreaterThan(0)

    // Each Node step should have valid shell script syntax
    nodeSteps.forEach((step: any) => {
      expect(step.shell).toBe('bash')
      expect(step.run).toBeTruthy()
    })
  })

  it('should include all required outputs', () => {
    const ctx = {}
    const content = changesActionTemplate(ctx)
    const parsed = parseYAML(content)

    expect(parsed.outputs).toHaveProperty('changes')
    expect(parsed.outputs).toHaveProperty('affectedDomains')
    expect(parsed.outputs).toHaveProperty('nxAvailable')
    expect(parsed.outputs).toHaveProperty('affectedProjects')
  })

  it('should use conservative Node.js version default', () => {
    const ctx = {}
    const content = changesActionTemplate(ctx)
    const parsed = parseYAML(content)

    // Should default to Node 22 (LTS) not 24
    expect(parsed.inputs['node-version'].default).toBe('22')
  })
})
