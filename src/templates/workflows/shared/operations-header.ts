/**
 * Shared Header Operations
 *
 * Generates workflow header operations (name, run-name, on triggers) that are
 * common to both Nx and path-based pipeline templates.
 */

import { Scalar } from 'yaml'
import type { PathOperationConfig } from '../../../utils/ast-path-operations.js'

export interface HeaderContext {
  branchFlow: string[]
  /**
   * Node version for the pipeline (from config.runtime, or the existing file).
   * Falls back to PipeCraft defaults when not provided.
   */
  nodeVersion?: string
  /**
   * pnpm version for the pipeline (from config.runtime, or the existing file).
   * Falls back to PipeCraft defaults when not provided.
   */
  pnpmVersion?: string
  /**
   * When true, nodeVersion came from config.runtime and is authoritative:
   * regeneration overwrites env.NODE_VERSION instead of preserving the existing
   * value. When false/undefined the existing value is preserved.
   */
  nodeVersionFromConfig?: boolean
  /** As nodeVersionFromConfig, for env.PNPM_VERSION. */
  pnpmVersionFromConfig?: boolean
}

/**
 * Create workflow header operations (name, run-name, on triggers)
 */
export function createHeaderOperations(ctx: HeaderContext): PathOperationConfig[] {
  const { branchFlow, nodeVersion, pnpmVersion, nodeVersionFromConfig, pnpmVersionFromConfig } = ctx
  // Provide sensible defaults if branchFlow is invalid
  const validBranchFlow =
    branchFlow && Array.isArray(branchFlow) && branchFlow.length > 0 ? branchFlow : ['main']
  const branchList = validBranchFlow.join(',')
  const normalizedNodeVersion =
    typeof nodeVersion === 'string' && nodeVersion.trim().length > 0 ? nodeVersion.trim() : '22'
  // Default to an exact pnpm patch (not a floating major). pnpm 'latest' silently became
  // pnpm 11 and broke installs (ERR_PNPM_IGNORED_BUILDS); an exact default is reproducible.
  // Projects can override via config.runtime.pnpmVersion.
  const normalizedPnpmVersion =
    typeof pnpmVersion === 'string' && pnpmVersion.trim().length > 0 ? pnpmVersion.trim() : '10.6.2'

  return [
    // =============================================================================
    // WORKFLOW NAME
    // =============================================================================
    {
      path: 'name',
      operation: 'preserve',
      value: new Scalar('Pipeline'),
      required: true
    },

    // =============================================================================
    // CONCURRENCY - One pipeline per branch at a time
    // =============================================================================
    // Prevents two rapid pushes / a re-run from racing version -> tag -> promote.
    // Queued (cancel-in-progress: false) rather than cancelled, so an in-flight
    // promotion is never interrupted mid-way (which could half-promote).
    {
      path: 'concurrency',
      operation: 'preserve',
      value: {
        group: '${{ github.workflow }}-${{ github.ref_name }}',
        'cancel-in-progress': false
      },
      required: true,
      spaceBefore: true
    },

    // =============================================================================
    // PERMISSIONS - Required for workflow operations
    // =============================================================================
    // contents: write - For creating tags and pushing changes
    // pull-requests: write - For creating pull requests during promotion
    // actions: write - For triggering workflow_dispatch on target branches
    {
      path: 'permissions',
      operation: 'preserve',
      value: {
        contents: 'write',
        'pull-requests': 'write',
        actions: 'write'
      },
      required: true,
      spaceBefore: true
    },

    // =============================================================================
    // RUN NAME - Display name for workflow runs
    // =============================================================================
    {
      path: 'run-name',
      operation: 'preserve',
      value: (() => {
        const runNameScalar = new Scalar(
          `\${{ github.event_name == 'pull_request' && !contains('${branchList}', github.head_ref) && github.event.pull_request.title || github.ref_name }} #\${{ inputs.run_number || github.run_number }}\${{ inputs.version && format(' - {0}', inputs.version) || '' }}`
        )
        runNameScalar.type = Scalar.QUOTE_DOUBLE
        // Prevent line breaking by treating as a single unit
        ;(runNameScalar as any).type = 'QUOTE_DOUBLE'
        return runNameScalar
      })(),
      required: true,
      spaceBefore: true
    },

    // =============================================================================
    // ENVIRONMENT VARIABLES
    // =============================================================================
    {
      path: 'env',
      operation: 'preserve',
      value: {},
      required: true,
      spaceBefore: true,
      commentBefore: `Git fetch depth configuration
 - FETCH_DEPTH_AFFECTED: For change detection and Nx affected analysis
   Lower values (50-100) improve performance, higher values (200+) improve accuracy
   Use 0 for complete history if your branches diverge significantly
 - FETCH_DEPTH_VERSIONING: For semantic version calculation (needs git tags)
   Should almost always be 0 to access all tags

Runtime versions
 Update these to match your project's requirements without regenerating workflows`
    },
    {
      path: 'env.FETCH_DEPTH_AFFECTED',
      operation: 'preserve',
      value: new Scalar('100'),
      required: true
    },
    {
      path: 'env.FETCH_DEPTH_VERSIONING',
      operation: 'preserve',
      value: new Scalar('0'),
      required: true
    },
    {
      // config.runtime is authoritative (overwrite); otherwise preserve existing
      path: 'env.NODE_VERSION',
      operation: nodeVersionFromConfig ? 'overwrite' : 'preserve',
      value: new Scalar(normalizedNodeVersion),
      required: true
    },
    {
      path: 'env.PNPM_VERSION',
      operation: pnpmVersionFromConfig ? 'overwrite' : 'preserve',
      value: new Scalar(normalizedPnpmVersion),
      required: true
    },

    // =============================================================================
    // WORKFLOW TRIGGERS
    // =============================================================================
    {
      path: 'on',
      operation: 'set',
      value: {},
      required: true,
      spaceBefore: true
    },

    // workflow_dispatch inputs
    {
      path: 'on.workflow_dispatch.inputs.version',
      operation: 'set',
      value: {
        description: 'The version to deploy',
        required: false,
        type: 'string'
      },
      required: true
    },
    {
      path: 'on.workflow_dispatch.inputs.baseRef',
      operation: 'set',
      value: {
        description: 'The base reference for comparison',
        required: false,
        type: 'string'
      },
      required: true
    },
    {
      path: 'on.workflow_dispatch.inputs.run_number',
      operation: 'set',
      value: {
        description: 'The original run number from develop branch',
        required: false,
        type: 'string'
      },
      required: true
    },
    {
      path: 'on.workflow_dispatch.inputs.commitSha',
      operation: 'set',
      value: {
        description: 'The exact commit SHA to checkout and test',
        required: false,
        type: 'string'
      },
      required: true
    },
    {
      path: 'on.workflow_dispatch.inputs.beforeSha',
      operation: 'set',
      value: {
        description: 'The commit SHA before promotion (for change detection)',
        required: false,
        type: 'string'
      },
      required: true
    },

    // workflow_call inputs (same as workflow_dispatch)
    {
      path: 'on.workflow_call.inputs.version',
      operation: 'set',
      value: {
        description: 'The version to deploy',
        required: false,
        type: 'string'
      },
      required: true
    },
    {
      path: 'on.workflow_call.inputs.baseRef',
      operation: 'set',
      value: {
        description: 'The base reference for comparison',
        required: false,
        type: 'string'
      },
      required: true
    },
    {
      path: 'on.workflow_call.inputs.run_number',
      operation: 'set',
      value: {
        description: 'The original run number from develop branch',
        required: false,
        type: 'string'
      },
      required: true
    },
    {
      path: 'on.workflow_call.inputs.commitSha',
      operation: 'set',
      value: {
        description: 'The exact commit SHA to checkout and test',
        required: false,
        type: 'string'
      },
      required: true
    },
    {
      path: 'on.workflow_call.inputs.beforeSha',
      operation: 'set',
      value: {
        description: 'The commit SHA before promotion (for change detection)',
        required: false,
        type: 'string'
      },
      required: true
    },

    // push trigger
    {
      path: 'on.push.branches',
      operation: 'set',
      value: validBranchFlow,
      required: true
    },

    // pull_request trigger
    {
      path: 'on.pull_request.types',
      operation: 'set',
      value: ['opened', 'synchronize', 'reopened'],
      required: true
    },
    {
      path: 'on.pull_request.branches',
      operation: 'set',
      value: [validBranchFlow[0]], // Only target initial branch
      required: true
    }
  ]
}
