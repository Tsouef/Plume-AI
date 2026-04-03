import { describe, it, expect } from 'vitest'
import { DEFAULT_CONFIG, mergeConfig } from './config-defaults'

describe('DEFAULT_CONFIG', () => {
  it('has activeProvider gemini', () => {
    expect(DEFAULT_CONFIG.activeProvider).toBe('gemini')
  })

  it('has empty providers array', () => {
    expect(DEFAULT_CONFIG.providers).toEqual([])
  })

  it('has auto language', () => {
    expect(DEFAULT_CONFIG.language).toBe('auto')
  })

  it('has empty disabledDomains', () => {
    expect(DEFAULT_CONFIG.disabledDomains).toEqual([])
  })
})

describe('mergeConfig', () => {
  it('returns defaults for empty object', () => {
    expect(mergeConfig({})).toEqual(DEFAULT_CONFIG)
  })

  it('overrides language', () => {
    const result = mergeConfig({ language: 'fr-FR' })
    expect(result.language).toBe('fr-FR')
    expect(result.activeProvider).toBe('gemini')
  })

  it('overrides providers array', () => {
    const providers = [{ id: 'gemini' as const, apiKey: 'AIza-test' }]
    const result = mergeConfig({ providers })
    expect(result.providers).toEqual(providers)
  })
})
