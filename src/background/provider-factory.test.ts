import { describe, it, expect } from 'vitest'
import { getActiveProvider } from './provider-factory'
import { GeminiProvider } from './providers/gemini'
import { ClaudeProvider } from './providers/claude'
import { OpenAIProvider } from './providers/openai'
import { MistralProvider } from './providers/mistral'
import { OllamaProvider } from './providers/ollama'
import type { Config } from '../shared/types'

const base: Config = {
  activeProvider: 'gemini',
  providers: [
    { id: 'gemini', apiKey: '' },
    { id: 'claude', apiKey: '' },
    { id: 'openai', apiKey: '' },
    { id: 'mistral', apiKey: '' },
    { id: 'ollama', baseUrl: 'http://localhost:11434' },
  ],
  language: 'auto',
  uiLanguage: 'en',
  uiTheme: 'dark',
  disabledDomains: [],
  manualOnly: false,
  trustedDomains: [],
}

describe('getActiveProvider', () => {
  it('returns GeminiProvider when active is gemini', () => {
    const config: Config = {
      ...base,
      activeProvider: 'gemini',
      providers: [{ id: 'gemini', apiKey: 'AIza-test' }],
    }
    expect(getActiveProvider(config)).toBeInstanceOf(GeminiProvider)
  })

  it('returns ClaudeProvider when active is claude', () => {
    const config: Config = {
      ...base,
      activeProvider: 'claude',
      providers: [{ id: 'claude', apiKey: 'sk-ant-test' }],
    }
    expect(getActiveProvider(config)).toBeInstanceOf(ClaudeProvider)
  })

  it('returns OpenAIProvider when active is openai', () => {
    const config: Config = {
      ...base,
      activeProvider: 'openai',
      providers: [{ id: 'openai', apiKey: 'sk-test' }],
    }
    expect(getActiveProvider(config)).toBeInstanceOf(OpenAIProvider)
  })

  it('returns MistralProvider when active is mistral', () => {
    const config: Config = {
      ...base,
      activeProvider: 'mistral',
      providers: [{ id: 'mistral', apiKey: 'mis-test' }],
    }
    expect(getActiveProvider(config)).toBeInstanceOf(MistralProvider)
  })

  it('returns OllamaProvider when active is ollama', () => {
    const config: Config = {
      ...base,
      activeProvider: 'ollama',
      providers: [{ id: 'ollama', baseUrl: 'http://localhost:11434' }],
    }
    expect(getActiveProvider(config)).toBeInstanceOf(OllamaProvider)
  })

  it('throws NO_PROVIDER_CONFIGURED when providers array is empty', () => {
    const config: Config = { ...base, providers: [] }
    expect(() => getActiveProvider(config)).toThrow('NO_PROVIDER_CONFIGURED')
  })

  it('throws NO_PROVIDER_CONFIGURED when gemini apiKey is empty', () => {
    const config: Config = {
      ...base,
      activeProvider: 'gemini',
      providers: [{ id: 'gemini', apiKey: '' }],
    }
    expect(() => getActiveProvider(config)).toThrow('NO_PROVIDER_CONFIGURED')
  })

  it('throws NO_PROVIDER_CONFIGURED when claude apiKey is empty', () => {
    const config: Config = {
      ...base,
      activeProvider: 'claude',
      providers: [{ id: 'claude', apiKey: '' }],
    }
    expect(() => getActiveProvider(config)).toThrow('NO_PROVIDER_CONFIGURED')
  })

  it('does not throw for Ollama when no apiKey is set (no key needed)', () => {
    const config: Config = {
      ...base,
      activeProvider: 'ollama',
      providers: [{ id: 'ollama', baseUrl: 'http://localhost:11434' }],
    }
    expect(() => getActiveProvider(config)).not.toThrow()
  })

  it('uses default model when stored model is empty string', () => {
    const config: Config = {
      ...base,
      activeProvider: 'gemini',
      providers: [{ id: 'gemini', apiKey: 'key', model: '' }],
    }
    // Should not throw — the provider is correctly constructed with default model
    expect(() => getActiveProvider(config)).not.toThrow()
  })
})
