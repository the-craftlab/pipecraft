import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the GitHub I/O functions but keep the pure helpers
// (getRequiredPermissionChanges, formatOrgActionsLockMessage) real so the test
// asserts the real actionable message.
vi.mock('../../src/utils/github-setup.js', async importActual => {
  const actual = await importActual<typeof import('../../src/utils/github-setup.js')>()
  return {
    ...actual,
    getRepositoryInfo: vi.fn(),
    getGitHubToken: vi.fn(),
    getWorkflowPermissions: vi.fn(),
    getOrgWorkflowPermissions: vi.fn()
  }
})

import { checkGitHubPermissions } from '../../src/utils/doctor.js'
import {
  getGitHubToken,
  getOrgWorkflowPermissions,
  getRepositoryInfo,
  getWorkflowPermissions
} from '../../src/utils/github-setup.js'

const mockGetRepositoryInfo = getRepositoryInfo as unknown as ReturnType<typeof vi.fn>
const mockGetGitHubToken = getGitHubToken as unknown as ReturnType<typeof vi.fn>
const mockGetWorkflowPermissions = getWorkflowPermissions as unknown as ReturnType<typeof vi.fn>
const mockGetOrgWorkflowPermissions = getOrgWorkflowPermissions as unknown as ReturnType<
  typeof vi.fn
>

describe('doctor: checkGitHubPermissions() org-level Actions PR lock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRepositoryInfo.mockReturnValue({
      owner: 'my-org',
      repo: 'monorepo',
      remote: 'https://github.com/my-org/monorepo.git'
    })
    mockGetGitHubToken.mockReturnValue('token123')
    // repo can write but cannot approve PRs
    mockGetWorkflowPermissions.mockResolvedValue({
      default_workflow_permissions: 'write',
      can_approve_pull_request_reviews: false
    })
  })

  it('reports an org-policy lock with actionable org guidance (not a raw setup-github suggestion)', async () => {
    // org itself disallows Actions creating/approving PRs
    mockGetOrgWorkflowPermissions.mockResolvedValue({
      default_workflow_permissions: 'read',
      can_approve_pull_request_reviews: false
    })

    const category = await checkGitHubPermissions()
    const prResult = category.results.find(r => r.message.includes('Cannot create/approve PRs'))

    expect(prResult).toBeDefined()
    expect(prResult?.status).toBe('error')
    expect(prResult?.message).toContain('organization policy')
    // Actionable: points the user at org settings, NOT at `pipecraft setup-github`
    // (which would fail with a 409 against an org lock)
    expect(prResult?.fix?.description).toContain('Organization-level policy')
    expect(prResult?.fix?.command).toContain(
      'https://github.com/organizations/my-org/settings/actions'
    )
    expect(prResult?.fix?.command).not.toBe('pipecraft setup-github')
  })

  it('falls back to the setup-github suggestion when the lock is repo-level (org check indeterminate)', async () => {
    // org endpoint not accessible (personal account / no admin scope) -> null
    mockGetOrgWorkflowPermissions.mockResolvedValue(null)

    const category = await checkGitHubPermissions()
    const prResult = category.results.find(r => r.message.includes('Cannot create/approve PRs'))

    expect(prResult).toBeDefined()
    expect(prResult?.status).toBe('error')
    expect(prResult?.message).toBe('Cannot create/approve PRs (should be enabled)')
    expect(prResult?.fix?.command).toBe('pipecraft setup-github')
  })
})
