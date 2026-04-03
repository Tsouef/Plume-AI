import { describe, it, expect } from 'vitest'
import { getActiveProvider } from './provider-factory'
import { GeminiProvider } from './providers/gemini'
import { Config } from '../shared/types'

const base: Config = {
  activeProvider: 'gemini',
  providers: [],
  language: 'auto',
  disabledDomains: [],
}

describe('getActiveProvider', () => {
  it('returns GeminiProvider when active is gemini', () => {
    const config: Config = { ...base, providers: [{ id: 'gemini', apiKey: 'AIza-test' }] }
    expect(getActiveProvider(config)).toBeInstanceOf(GeminiProvider)
  })

  it('throws NO_PROVIDER_CONFIGURED when providers array is empty', () => {
    expect(() => getActiveProvider(base)).toThrow('NO_PROVIDER_CONFIGURED')
  })

  it('throws NO_PROVIDER_CONFIGURED when apiKey is empty', () => {
    const config: Config = { ...base, providers: [{ id: 'gemini', apiKey: '' }] }
    expect(() => getActiveProvider(config)).toThrow('NO_PROVIDER_CONFIGURED')
  })
})
