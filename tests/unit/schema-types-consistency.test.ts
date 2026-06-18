/**
 * schema <-> types consistency
 *
 * The JSON schema (.pipecraft-schema.json) is the editor source of truth and (after
 * P0.2) the runtime validator. The TypeScript interfaces in src/types are the
 * compile-time source of truth. These two drift silently — that drift is the root
 * cause of the historical `autoMerge`/`nx`/`runtime` bugs.
 *
 * KNOWN_CONFIG_KEYS / KNOWN_DOMAIN_KEYS bridge them: a compile-time assertion ties
 * each constant to its interface (see src/types/index.ts), and the tests below tie
 * the constants to the schema. Transitively, the schema stays in lockstep with the
 * types. If you add a config key, you must add it to the interface, the constant, AND
 * the schema — or one of these checks fails.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { KNOWN_CONFIG_KEYS, KNOWN_DOMAIN_KEYS } from '../../src/types/index.js'
import { loadConfig } from '../../src/utils/config.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const schema = JSON.parse(readFileSync(resolve(repoRoot, '.pipecraft-schema.json'), 'utf8'))

// `$schema` is an editor-only meta key, not a config field.
const schemaTopLevelKeys = Object.keys(schema.properties).filter(k => k !== '$schema')
const schemaDomainKeys = Object.keys(schema.definitions.DomainConfig.properties)

describe('schema <-> types consistency', () => {
  it('every schema top-level property is a KNOWN_CONFIG_KEY', () => {
    const known = new Set<string>(KNOWN_CONFIG_KEYS)
    const extraInSchema = schemaTopLevelKeys.filter(k => !known.has(k))
    expect(extraInSchema).toEqual([])
  })

  it('every KNOWN_CONFIG_KEY exists in the schema', () => {
    const inSchema = new Set(schemaTopLevelKeys)
    const missingFromSchema = KNOWN_CONFIG_KEYS.filter(k => !inSchema.has(k))
    expect(missingFromSchema).toEqual([])
  })

  it('exposes runtime config in the schema (regression: runtime was types-only)', () => {
    expect(schemaTopLevelKeys).toContain('runtime')
    expect(schema.properties.runtime.type).toBe('object')
    expect(Object.keys(schema.properties.runtime.properties)).toEqual(
      expect.arrayContaining(['nodeVersion', 'pnpmVersion'])
    )
  })

  it('domain properties match between schema and KNOWN_DOMAIN_KEYS', () => {
    const known = new Set<string>(KNOWN_DOMAIN_KEYS)
    const inSchema = new Set(schemaDomainKeys)
    expect(schemaDomainKeys.filter(k => !known.has(k))).toEqual([])
    expect(KNOWN_DOMAIN_KEYS.filter(k => !inSchema.has(k))).toEqual([])
  })

  it("this repo's own .pipecraftrc uses only known keys", () => {
    const config = loadConfig(resolve(repoRoot, '.pipecraftrc'))
    const known = new Set<string>([...KNOWN_CONFIG_KEYS, '$schema'])
    const unknown = Object.keys(config).filter(k => !known.has(k))
    expect(unknown).toEqual([])
  })
})
