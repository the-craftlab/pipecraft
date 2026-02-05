/**
 * Detect Changes Action Template
 *
 * Generates a REUSABLE GitHub composite action that detects which domains have changed
 * using path-based change detection with dorny/paths-filter.
 *
 * ## Purpose
 *
 * This action is **configuration-driven** and accepts domain definitions as YAML input,
 * making it truly reusable across any project without regeneration.
 * It uses path filters to detect which domains changed based on file glob patterns.
 *
 * ## Key Design Principle
 *
 * **Domains are passed as input, not hardcoded in the action.**
 * This allows the same action to work with any domain configuration without regeneration.
 *
 * ## Generated Action Location
 *
 * `actions/detect-changes/action.yml`
 *
 * @module templates/actions/detect-changes.yml.tpl
 */

import { type PinionContext, renderTemplate, toFile } from '@featherscloud/pinion'
import fs from 'fs'
import { logger } from '../../utils/logger.js'
import { getActionOutputDir, shouldGenerateActions } from '../../utils/action-reference.js'
import type { PipecraftConfig } from '../../types/index.js'

/**
 * Generates the detect-changes composite action YAML content.
 *
 * Creates a GitHub Actions composite action that:
 * - Accepts domain configuration as YAML input (not hardcoded)
 * - Dynamically parses domains using yq or grep fallback
 * - Uses dorny/paths-filter for path-based change detection
 * - Outputs individual domain results AND a JSON summary
 *
 * @param {any} ctx - Context (not used - action is fully dynamic now)
 * @returns {string} YAML content for the composite action
 */
const changesActionTemplate = (ctx: any) => {
  return `name: 'Detect Changes (Configuration-Driven)'
description: 'Path-based change detection using dorny/paths-filter. Accepts domain configuration as YAML input.'
author: 'Pipecraft'

inputs:
  baseRef:
    description: 'Base reference to compare against'
    required: false
    default: 'main'
  beforeSha:
    description: 'Commit SHA before promotion (for accurate change detection on workflow_dispatch)'
    required: false
    default: ''
  domains-config:
    description: 'YAML string of domain configurations (embedded in pipeline at generation time)'
    required: true

outputs:
  changes:
    description: 'JSON object with domain change results (e.g., {"core": true, "docs": false})'
    value: \${{ steps.output.outputs.changes }}
  affectedDomains:
    description: 'Comma-separated list of domains with changes'
    value: \${{ steps.output.outputs.affectedDomains }}

runs:
  using: 'composite'
  steps:
    - name: Set Base Branch
      id: set-base
      shell: bash
      run: |
        base_branch=\${{ inputs.baseRef || 'main' }}
        echo "base_branch=$base_branch" >> $GITHUB_OUTPUT
        echo "base_branch=$base_branch" >> $GITHUB_ENV

    - name: Parse Domain Configuration
      id: parse-domains
      shell: bash
      run: |
        # Parse the domains-config YAML input (embedded in pipeline at generation time)
        echo "\${{ inputs.domains-config }}" > /tmp/domains-config.yml

        # Extract domain names using yq (or fallback to grep/awk)
        if command -v yq >/dev/null 2>&1; then
          DOMAIN_NAMES=$(yq eval 'keys | join(",")' /tmp/domains-config.yml)
        else
          # Fallback: extract domain names without yq
          DOMAIN_NAMES=$(grep -E '^[[:space:]]*[a-zA-Z0-9_-]+:' /tmp/domains-config.yml | sed 's/[[:space:]]*\\(.*\\):.*/\\1/' | tr '\\n' ',' | sed 's/,$//')
        fi

        echo "domains=$DOMAIN_NAMES" >> $GITHUB_OUTPUT
        echo "📋 Configured domains: $DOMAIN_NAMES"

    - name: Transform Domain Config for Paths Filter
      id: transform-config
      shell: bash
      run: |
        # Transform domains-config from PipeCraft format to paths-filter format
        # PipeCraft format: domain: { paths: [...] }
        # paths-filter format: domain: [...]

        # Read the domains config
        cat /tmp/domains-config.yml

        # Transform: remove 'paths:' lines and unindent the glob patterns
        sed '/paths:/d' /tmp/domains-config.yml | sed 's/^  -/-/' > /tmp/paths-filter-config.yml

        echo ""
        echo "Transformed for paths-filter:"
        cat /tmp/paths-filter-config.yml

        # Store as output for use in paths-filter
        {
          echo "filters<<EOF"
          cat /tmp/paths-filter-config.yml
          echo "EOF"
        } >> $GITHUB_OUTPUT

    - name: Configure Change Detection
      id: config-detection
      shell: bash
      run: |
        BEFORE_SHA="\${{ inputs.beforeSha }}"
        BASE_BRANCH="\${{ steps.set-base.outputs.base_branch }}"

        if [ -n "$BEFORE_SHA" ]; then
          # Promoted build: compare current SHA against the pre-promotion SHA
          echo "base=$BEFORE_SHA" >> $GITHUB_OUTPUT
          echo "ref=\${{ github.sha }}" >> $GITHUB_OUTPUT
          echo "📍 Promoted build: comparing \${{ github.sha }} against $BEFORE_SHA"
        else
          # Regular push/PR: compare against base branch
          echo "base=$BASE_BRANCH" >> $GITHUB_OUTPUT
          echo "ref=" >> $GITHUB_OUTPUT
          echo "📍 Regular build: comparing against $BASE_BRANCH"
        fi

    - name: Detect Changes with Paths Filter
      uses: dorny/paths-filter@v3
      id: filter
      with:
        base: \${{ steps.config-detection.outputs.base }}
        ref: \${{ steps.config-detection.outputs.ref }}
        filters: \${{ steps.transform-config.outputs.filters }}

    - name: Generate Outputs
      id: output
      shell: bash
      run: |
        echo "📁 Using path-based change detection"
        echo "{" > /tmp/path-results.json

        IFS=',' read -ra DOMAIN_NAMES <<< "\${{ steps.parse-domains.outputs.domains }}"
        FIRST=true
        for domain in "\${DOMAIN_NAMES[@]}"; do
          domain=$(echo "$domain" | xargs)
          if [ "$FIRST" = true ]; then
            FIRST=false
          else
            echo "," >> /tmp/path-results.json
          fi

          # Check if domain appears in filter changes
          if echo "\${{ steps.filter.outputs.changes }}" | grep -q "$domain"; then
            echo "  \\"$domain\\": true" >> /tmp/path-results.json
          else
            echo "  \\"$domain\\": false" >> /tmp/path-results.json
          fi
        done
        echo "}" >> /tmp/path-results.json

        CHANGES_JSON=$(cat /tmp/path-results.json)

        # Output the JSON
        echo "changes<<EOF" >> $GITHUB_OUTPUT
        echo "$CHANGES_JSON" >> $GITHUB_OUTPUT
        echo "EOF" >> $GITHUB_OUTPUT

        # Build comma-separated list of affected domains (using node instead of jq for portability)
        AFFECTED_DOMAINS=$(node -e "
          const data = JSON.parse(process.argv[1]);
          const affected = Object.entries(data)
            .filter(([_, v]) => v === true)
            .map(([k]) => k)
            .join(',');
          console.log(affected);
        " "$CHANGES_JSON")
        echo "affectedDomains=$AFFECTED_DOMAINS" >> $GITHUB_OUTPUT

        echo "📋 Change Detection Results:"
        node -e "console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2))" "$CHANGES_JSON"
        echo "🎯 Affected domains: $AFFECTED_DOMAINS"
`
}

/**
 * Generator entry point for detect-changes composite action.
 *
 * Generates the \`actions/detect-changes/action.yml\` file with configuration-driven
 * change detection logic. This action accepts domain configuration as input at runtime,
 * making it truly reusable without regeneration.
 *
 * @param {PinionContext} ctx - Pinion generator context
 * @returns {Promise<PinionContext>} Updated context after file generation
 */
export const generate = (ctx: PinionContext & { config?: Partial<PipecraftConfig> }) =>
  Promise.resolve(ctx).then(ctx => {
    const config = ctx.config || {}

    if (!shouldGenerateActions(config)) {
      logger.verbose('Skipping detect-changes action generation (using remote actions)')
      return ctx
    }

    const outputDir = getActionOutputDir(config)
    const filePath = `${outputDir}/detect-changes/action.yml`
    const exists = fs.existsSync(filePath)
    const status = exists ? '🔄 Merged with existing' : '📝 Created new'
    logger.verbose(`${status} ${filePath}`)

    return renderTemplate(changesActionTemplate, toFile(filePath))(ctx)
  })
