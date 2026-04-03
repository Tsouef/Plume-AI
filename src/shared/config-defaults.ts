import { Config } from './types'

export const DEFAULT_CONFIG: Config = {
  activeProvider: 'gemini',
  providers: [],
  language: 'auto',
  disabledDomains: [],
}

export function mergeConfig(stored: Partial<Config>): Config {
  return { ...DEFAULT_CONFIG, ...stored }
}
