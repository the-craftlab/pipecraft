/**
 * Shared Version Job Operation
 *
 * Generates the version calculation job that determines the next semantic version.
 */

import {
  createValueFromString,
  type PathOperationConfig
} from '../../../utils/ast-path-operations.js'
import { getActionReference } from '../../../utils/action-reference.js'
import type { PipecraftConfig } from '../../../types/index.js'

export interface VersionContext {
  testJobNames: string[]
  baseRef?: string
  config?: Partial<PipecraftConfig>
}

/**
 * Create the version calculation job operation
 */
export function createVersionJobOperation(ctx: VersionContext): PathOperationConfig {
  const { testJobNames, baseRef = 'main', config = {} } = ctx

  // Get the action reference based on configuration
  const actionRef = getActionReference('calculate-version', config)

  // Build the needs array
  const needsArray = ['changes', ...testJobNames].filter(Boolean)

  // Build the conditional logic
  const testConditions =
    testJobNames.length > 0
      ? [
          `(${testJobNames.map(job => `needs.${job}.result == 'success'`).join(' || ')})`,
          testJobNames.map(job => `needs.${job}.result != 'failure'`).join(' && ')
        ]
      : []

  const allConditions = ['always()', "github.event_name != 'pull_request'", ...testConditions]
    .filter(Boolean)
    .join(' && ')

  return {
    path: 'jobs.version',
    operation: 'overwrite',
    spaceBefore: true,
    commentBefore: `
=============================================================================
 VERSIONING (⚠️  Managed by Pipecraft - do not modify)
=============================================================================
 Calculates the next semantic version based on conventional commits.
 Only runs on push events (skipped on pull requests).
`,
    value: createValueFromString(`
    needs: [ ${needsArray.join(', ')} ]
    if: \${{ ${allConditions} }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ inputs.commitSha || github.sha }}
          fetch-depth: \${{ env.FETCH_DEPTH_VERSIONING }}
      - uses: ${actionRef}
        id: version
        with:
          baseRef: \${{ inputs.baseRef || '${baseRef}' }}
          version: \${{ inputs.version }}
          node-version: \${{ env.NODE_VERSION }}
          commitSha: \${{ inputs.commitSha }}
    outputs:
      version: \${{ steps.version.outputs.version }}
  `)
  }
}
