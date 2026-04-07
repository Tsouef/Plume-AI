import type { Config } from './types'

export const DEFAULT_CONFIG: Config = {
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

export function mergeConfig(stored: Partial<Config>): Config {
  return {
    ...DEFAULT_CONFIG,
    ...stored,
    providers: stored.providers ?? DEFAULT_CONFIG.providers,
    disabledDomains: stored.disabledDomains ?? DEFAULT_CONFIG.disabledDomains,
    trustedDomains: stored.trustedDomains ?? DEFAULT_CONFIG.trustedDomains,
  }
}
