# Documentation Update Status

**Date:** 2026-02-05
**Branch:** develop
**Last Updated By:** Claude Code session

---

## Completed Today

### 1. Repository URL Fix (Critical)

**Status:** ✅ Complete

Fixed all references from `pipecraft-lab/pipecraft` to `the-craftlab/pipecraft`.

**Files Updated (22):**
- `README.md` - Fixed URLs + removed stray "# Testing change detection" line
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `DOCS_AUDIT_PROGRESS.md`
- `docs/docusaurus.config.ts`
- `docs/typedoc.json`
- `docs/docs/intro.md`
- `docs/docs/faq.md`
- `docs/docs/troubleshooting.md`
- `docs/docs/roadmap.md`
- `docs/docs/contributing.md`
- `docs/docs/readme.md`
- `docs/docs/docs-index.md`
- `docs/docs/testing-guide.md`
- `docs/docs/error-handling.md`
- `docs/docs/configuration-reference.md`
- `docs/docs/action-modes.md`
- `docs/docs/flows/trunk-flow.md`
- `docs/docs/flows/custom-flow.md`
- `docs/docs/flows/gitflow.md`
- `docs/docs/flows/github-flow.md`

**Remaining (auto-generated, will fix on next build):**
- 34 files in `docs/api/` and `docs/docs/api/` - These are TypeDoc auto-generated
- Run `pnpm docs:typedoc` to regenerate with correct URLs

---

## Documentation Review Findings

A comprehensive review was completed. Here's the prioritized list of remaining work:

### High Priority

#### 2. Remove NX References (NX support removed in PR #297)

**Status:** ❌ Not Started

Files still referencing NX:
- `docs/docs/intro.md` - Lines mentioning "Nx integration"
- `docs/docs/faq.md` - Entire NX section needs removal
- `docs/docs/configuration-reference.md` - `useNxAffected` option
- `README.md` - Lines 87, 95, 206 mention NX

**Action:** Remove all NX-specific content. Add note: "For NX monorepos, define domains with paths matching your NX project structure."

#### 3. Document Version Passthrough

**Status:** ❌ Not Started

This core architectural concept is undocumented:
- When code promotes from develop → staging → main, `inputs.version` passes the calculated version
- Promoted branches don't recalculate version
- Enables test skipping optimization

**Files to update:**
- `docs/docs/flows/trunk-flow.md` - Add "Version Passthrough" section
- `docs/docs/version-management.md` - Explain the mechanism

#### 4. Document Test Skipping on Promoted Branches

**Status:** ❌ Not Started

The optimization we implemented today:
```yaml
if: ${{ !inputs.version && needs.changes.outputs.core == 'true' }}
```

Tests run once on develop, skip on promoted branches (identical code via fast-forward).

**Files to update:**
- `docs/docs/flows/trunk-flow.md` - Add "Pipeline Optimization" section

#### 5. Document Publish Workflow Trigger

**Status:** ❌ Not Started

The `create-release` action uses `--ref main` to trigger publish workflow. This subtlety should be documented.

**Files to update:**
- `docs/docs/version-management.md` or new "Publishing" section

### Medium Priority

#### 6. Add Trunk-Based Development Philosophy Section

**Status:** ❌ Not Started

Docs explain *what* but not *why*. Add advocacy for:
- Small, frequent merges vs long-lived branches
- Fast-forward promotions guarantee identical code
- Tests run once, not redundantly

**Files to update:**
- `docs/docs/intro.md` or `docs/docs/flows/trunk-flow.md`

#### 7. Expand architecture.md (Currently 70 lines)

**Status:** ❌ Not Started

Should be a deep technical document explaining:
- Template system (`@featherscloud/pinion`)
- AST path operations
- Job dependency graph
- Managed vs custom sections

#### 8. Split intro.md (Currently 382 lines)

**Status:** ❌ Not Started

Recommended split:
1. Quick Start (50 lines max)
2. Tutorial (full walkthrough)
3. Core Concepts (reference material)

### Low Priority

#### 9. Expand troubleshooting.md (Currently 139 lines)

Add sections for:
- "Pipeline runs but tests don't execute"
- "Version calculation returns empty"
- "Promotion fails silently"
- "Publish workflow runs on wrong branch"

#### 10. Update FAQ - Remove NX questions, add new ones

- "Can I use Pipecraft with existing workflows?"
- "How do I debug a failed promotion?"
- "What happens if I modify a managed job?"

#### 11. Add Visual Diagrams

- Branch flow diagram (develop → staging → main)
- Job dependency graph
- Version calculation flowchart

Consider Mermaid diagrams for inline rendering.

---

## Commands to Run

### Regenerate TypeDoc (fixes remaining 34 files)
```bash
pnpm docs:typedoc
```

### Build and test docs site
```bash
cd docs && pnpm run build
```

### Run tests to ensure nothing broken
```bash
pnpm vitest run --exclude '.worktrees/**'
```

---

## Related Context

### Recent Pipeline Fixes (Same Session)
- Fixed publish workflow running on develop instead of main (`--ref main`)
- Fixed npm publish 422 error (repository URL mismatch)
- Added test skipping on promoted branches (`!inputs.version`)
- Removed `forceTests` input (users can edit job conditions directly)

### Files Changed for Pipeline
- `actions/create-release/action.yml`
- `src/templates/actions/create-release.yml.tpl.ts`
- `.github/workflows/pipeline.yml`
- `package.json` (repository URL)

---

## Next Session Checklist

1. [ ] Run `pnpm docs:typedoc` to fix auto-generated API docs
2. [ ] Remove NX references from docs
3. [ ] Document version passthrough mechanism
4. [ ] Document test skipping optimization
5. [ ] Add trunk-based philosophy section
6. [ ] Consider committing these changes

---

## Notes

- The `docs/api/` files are auto-generated by TypeDoc from source code comments
- Plan file exists at: `/Users/james/.claude/plans/proud-moseying-candy.md` (testing strategy)
- Memory file updated at: `/Users/james/.claude/projects/-Users-james-Sites-published-pipecraft/memory/MEMORY.md`
