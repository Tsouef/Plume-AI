import { Config } from '../shared/types'
import { AIProvider } from './providers/types'
import { GeminiProvider } from './providers/gemini'

export function getActiveProvider(config: Config): AIProvider {
  const providerConfig = config.providers.find((p) => p.id === config.activeProvider)
  if (!providerConfig || !providerConfig.apiKey) throw new Error('NO_PROVIDER_CONFIGURED')
  return new GeminiProvider(providerConfig.apiKey)
}
