/**
 * mergeQueue flag on the header and changes operations (in-process).
 *
 * tests/integration/merge-queue.test.ts proves the generated file through the CLI. These
 * cases call the two helpers directly so the flag's branches are covered in-process too.
 */
import { describe, expect, it } from 'vitest'
import { createChangesJobOperation } from '../../src/templates/workflows/shared/operations-changes.js'
import { createHeaderOperations } from '../../src/templates/workflows/shared/operations-header.js'

const branchFlow = ['develop', 'main']
const domains = { app: { paths: ['src/**'] } }

describe('mergeQueue header operations', () => {
  it('appends on.merge_group.types = [checks_requested] when true', () => {
    const op = createHeaderOperations({ branchFlow, mergeQueue: true }).find(
      o => o.path === 'on.merge_group.types'
    )

    expect(op?.operation).toBe('set')
    expect(op?.value).toEqual(['checks_requested'])
  })

  it.each([false, undefined])('emits no merge_group operation when %s', mergeQueue => {
    const paths = createHeaderOperations({ branchFlow, mergeQueue }).map(o => o.path)

    expect(paths).not.toContain('on.merge_group.types')
    expect(paths).toEqual(createHeaderOperations({ branchFlow }).map(o => o.path))
  })
})

describe('mergeQueue changes operation', () => {
  const beforeSha = (mergeQueue?: boolean): string => {
    const job = (
      createChangesJobOperation({ domains, baseRef: 'main', mergeQueue }).value as any
    ).toJSON()
    const detect = job.steps.find((s: any) => s.with && 'beforeSha' in s.with)
    return String(detect.with.beforeSha)
  }

  it('puts merge_group.base_sha ahead of github.event.before when true', () => {
    expect(beforeSha(true)).toBe(
      "${{ inputs.beforeSha || github.event.merge_group.base_sha || github.event.before || '' }}"
    )
  })

  it('keeps the existing beforeSha expression when unset', () => {
    expect(beforeSha()).toBe("${{ inputs.beforeSha || github.event.before || '' }}")
  })
})
