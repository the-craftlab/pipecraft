/**
 * Managed Workflow Utilities
 *
 * Provides helpers for creating and updating workflow YAML documents that
 * include the standard Pipecraft-managed jobs (changes, version, gate, tag,
 * promote, release) along with optional runner-specific test jobs.
 *
 * These utilities centralize the shared pieces of the path-based and Nx
 * workflow generators so new runner implementations (Turbo, Bazel, Pants, etc.)
 * can reuse the same core structure.
 */

import type { PinionContext, Configuration } from '@featherscloud/pinion'
import { Document, YAMLMap, parseDocument, stringify } from 'yaml'

import {
  applyPathOperations,
  type PathOperationConfig
} from '../../../utils/ast-path-operations.js'
import { ensureGateJob } from './operations-gate.js'

export interface ManagedWorkflowContext extends Omit<PinionContext, 'pinion'> {
  pinion?: Configuration & {
    force?: boolean
  }
}

const DEFAULT_STRINGIFY_OPTIONS = {
  lineWidth: 0,
  indent: 2,
  defaultStringType: 'PLAIN' as const,
  defaultKeyType: 'PLAIN' as const,
  minContentWidth: 0
}

function applyManagedOperations(doc: Document.Parsed, operations: PathOperationConfig[], force: boolean) {
  if (!doc.contents) {
    return
  }

  const rootNode = doc.contents as YAMLMap
  if (rootNode && typeof rootNode === 'object' && 'flow' in rootNode) {
    rootNode.flow = false
  }

  applyPathOperations(rootNode, operations, doc)
  ensureGateJob(doc, { force })
}

export function createManagedWorkflowDocument(
  headerComment: string,
  operations: PathOperationConfig[],
  ctx: ManagedWorkflowContext
): Document.Parsed {
  const doc = parseDocument('{}')
  doc.commentBefore = headerComment
  applyManagedOperations(doc, operations, Boolean(ctx.pinion?.force))
  return doc
}

export function updateManagedWorkflowDocument(
  existingContent: string,
  operations: PathOperationConfig[],
  ctx: ManagedWorkflowContext
): Document.Parsed {
  const doc = parseDocument(existingContent)
  applyManagedOperations(doc, operations, Boolean(ctx.pinion?.force))
  return doc
}

export function applyManagedWorkflowOperations(
  doc: Document.Parsed,
  operations: PathOperationConfig[],
  ctx: ManagedWorkflowContext
) {
  applyManagedOperations(doc, operations, Boolean(ctx.pinion?.force))
}

export function stringifyManagedWorkflow(
  doc: Document.Parsed,
  options: typeof DEFAULT_STRINGIFY_OPTIONS = DEFAULT_STRINGIFY_OPTIONS
) {
  return stringify(doc, options)
}

export { DEFAULT_STRINGIFY_OPTIONS as MANAGED_WORKFLOW_STRINGIFY_OPTIONS }


