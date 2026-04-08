import { describe, it, expect } from 'vitest'
import { DEFAULT_CONFIG, mergeConfig } from './config-defaults'

describe('mergeConfig', () => {
  it('returns defaults for empty object', () => {
    expect(mergeConfig({})).toEqual(DEFAULT_CONFIG)
  })

  it('overrides language while keeping other defaults', () => {
    const result = mergeConfig({ language: 'fr-FR' })
    expect(result.language).toBe('fr-FR')
    expect(result.activeProvider).toBe(DEFAULT_CONFIG.activeProvider)
  })

  it('overrides providers array', () => {
    const providers = [{ id: 'gemini' as const, apiKey: 'AIza-test' }]
    expect(mergeConfig({ providers }).providers).toEqual(providers)
  })

  it('keeps stored providers when present', () => {
    const result = mergeConfig({ providers: [{ id: 'gemini', apiKey: 'abc' }] })
    expect(result.providers).toEqual([{ id: 'gemini', apiKey: 'abc' }])
  })

  it('falls back to default providers when stored has none', () => {
    expect(mergeConfig({}).providers).toEqual(DEFAULT_CONFIG.providers)
  })

  it('does not lose providers when other top-level keys are missing', () => {
    const result = mergeConfig({ providers: [{ id: 'gemini', apiKey: 'xyz' }], language: 'fr-FR' })
    expect(result.providers[0].apiKey).toBe('xyz')
    expect(result.language).toBe('fr-FR')
  })
})
