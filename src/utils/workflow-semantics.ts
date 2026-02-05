/**
 * Workflow Semantic Validation
 *
 * Validates the semantic correctness of generated GitHub Actions workflows.
 * This includes:
 * - Job dependency validation (no circular dependencies)
 * - Missing job reference detection
 * - Output reference validation
 * - Unreachable job detection
 *
 * @module utils/workflow-semantics
 */

import { parse as parseYAML } from 'yaml'

export interface SemanticError {
  type: 'error'
  code: string
  message: string
  location?: string
}

export interface SemanticWarning {
  type: 'warning'
  code: string
  message: string
  location?: string
}

export interface SemanticValidationResult {
  valid: boolean
  errors: SemanticError[]
  warnings: SemanticWarning[]
}

interface ParsedJob {
  name: string
  needs: string[]
  if?: string
  outputs?: Record<string, string>
}

interface ParsedWorkflow {
  name?: string
  jobs: Record<string, ParsedJob>
}

/**
 * Parse a workflow YAML string into a structured format for validation.
 */
function parseWorkflow(yamlContent: string): ParsedWorkflow {
  const parsed = parseYAML(yamlContent)

  const jobs: Record<string, ParsedJob> = {}

  if (parsed.jobs && typeof parsed.jobs === 'object') {
    for (const [jobName, jobDef] of Object.entries(parsed.jobs)) {
      const job = jobDef as Record<string, unknown>
      let needs: string[] = []

      if (job.needs) {
        if (Array.isArray(job.needs)) {
          needs = job.needs.map(String)
        } else if (typeof job.needs === 'string') {
          needs = [job.needs]
        }
      }

      // Handle if condition - can be string or boolean in YAML
      let ifCondition: string | undefined
      if (job.if !== undefined) {
        ifCondition = String(job.if)
      }

      jobs[jobName] = {
        name: jobName,
        needs,
        if: ifCondition,
        outputs:
          job.outputs && typeof job.outputs === 'object'
            ? (job.outputs as Record<string, string>)
            : undefined
      }
    }
  }

  return {
    name: parsed.name,
    jobs
  }
}

/**
 * Detect circular dependencies in job needs.
 */
function detectCircularDependencies(jobs: Record<string, ParsedJob>): SemanticError[] {
  const errors: SemanticError[] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const path: string[] = []

  function dfs(jobName: string): boolean {
    if (recursionStack.has(jobName)) {
      // Found cycle - construct the cycle path
      const cycleStart = path.indexOf(jobName)
      const cyclePath = [...path.slice(cycleStart), jobName].join(' → ')
      errors.push({
        type: 'error',
        code: 'CIRCULAR_DEPENDENCY',
        message: `Circular dependency detected: ${cyclePath}`,
        location: `jobs.${jobName}`
      })
      return true
    }

    if (visited.has(jobName)) {
      return false
    }

    visited.add(jobName)
    recursionStack.add(jobName)
    path.push(jobName)

    const job = jobs[jobName]
    if (job) {
      for (const dep of job.needs) {
        if (jobs[dep]) {
          dfs(dep)
        }
      }
    }

    path.pop()
    recursionStack.delete(jobName)
    return false
  }

  for (const jobName of Object.keys(jobs)) {
    if (!visited.has(jobName)) {
      dfs(jobName)
    }
  }

  return errors
}

/**
 * Detect missing job references in needs arrays.
 */
function detectMissingJobReferences(jobs: Record<string, ParsedJob>): SemanticError[] {
  const errors: SemanticError[] = []
  const jobNames = new Set(Object.keys(jobs))

  for (const [jobName, job] of Object.entries(jobs)) {
    for (const dep of job.needs) {
      if (!jobNames.has(dep)) {
        errors.push({
          type: 'error',
          code: 'MISSING_JOB_REFERENCE',
          message: `Job "${jobName}" references non-existent job "${dep}" in needs`,
          location: `jobs.${jobName}.needs`
        })
      }
    }
  }

  return errors
}

/**
 * Detect invalid output references in job conditions or steps.
 */
function detectInvalidOutputReferences(
  jobs: Record<string, ParsedJob>,
  yamlContent: string
): SemanticError[] {
  const errors: SemanticError[] = []

  // Match patterns like needs.jobName.outputs.outputName
  const outputRefPattern = /needs\.([a-zA-Z0-9_-]+)\.outputs\.([a-zA-Z0-9_-]+)/g
  const matches = yamlContent.matchAll(outputRefPattern)

  for (const match of matches) {
    const [fullMatch, jobName, outputName] = match

    // Check if the referenced job exists
    if (!jobs[jobName]) {
      errors.push({
        type: 'error',
        code: 'INVALID_OUTPUT_REFERENCE',
        message: `Output reference "${fullMatch}" refers to non-existent job "${jobName}"`,
        location: fullMatch
      })
    }
  }

  return errors
}

/**
 * Detect unreachable jobs (jobs that can never run due to impossible conditions).
 * This is a warning, not an error.
 */
function detectUnreachableJobs(jobs: Record<string, ParsedJob>): SemanticWarning[] {
  const warnings: SemanticWarning[] = []
  const jobNames = new Set(Object.keys(jobs))

  for (const [jobName, job] of Object.entries(jobs)) {
    // Check if job depends on non-existent jobs (already an error, but also unreachable)
    const hasMissingDep = job.needs.some(dep => !jobNames.has(dep))

    // Check for obvious impossible conditions
    if (job.if) {
      // Detect conditions that are always false
      if (job.if === 'false' || job.if === '${{ false }}') {
        warnings.push({
          type: 'warning',
          code: 'UNREACHABLE_JOB',
          message: `Job "${jobName}" has condition that is always false`,
          location: `jobs.${jobName}.if`
        })
      }

      // Detect self-referencing conditions (job referencing its own results)
      if (job.if.includes(`needs.${jobName}.`)) {
        warnings.push({
          type: 'warning',
          code: 'SELF_REFERENCING_CONDITION',
          message: `Job "${jobName}" references its own results in condition`,
          location: `jobs.${jobName}.if`
        })
      }
    }
  }

  return warnings
}

/**
 * Validate job dependencies in a workflow.
 *
 * Checks for:
 * 1. Circular dependencies between jobs
 * 2. Missing job references in needs arrays
 * 3. Invalid output references
 * 4. Unreachable jobs (warning)
 *
 * @param yamlContent - The workflow YAML content as a string
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateJobDependencies(workflowYaml)
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors)
 * }
 * ```
 */
export function validateJobDependencies(yamlContent: string): SemanticValidationResult {
  const errors: SemanticError[] = []
  const warnings: SemanticWarning[] = []

  try {
    const workflow = parseWorkflow(yamlContent)

    // Run all validations
    errors.push(...detectCircularDependencies(workflow.jobs))
    errors.push(...detectMissingJobReferences(workflow.jobs))
    errors.push(...detectInvalidOutputReferences(workflow.jobs, yamlContent))
    warnings.push(...detectUnreachableJobs(workflow.jobs))
  } catch (err) {
    errors.push({
      type: 'error',
      code: 'PARSE_ERROR',
      message: `Failed to parse workflow YAML: ${err instanceof Error ? err.message : String(err)}`
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate a complete workflow for semantic correctness.
 *
 * This is the main entry point for workflow validation. It combines
 * job dependency validation with other semantic checks.
 *
 * @param yamlContent - The workflow YAML content as a string
 * @returns Validation result with errors and warnings
 */
export function validateWorkflowSemantics(yamlContent: string): SemanticValidationResult {
  return validateJobDependencies(yamlContent)
}
