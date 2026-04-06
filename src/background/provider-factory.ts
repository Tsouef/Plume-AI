import type { Config, ProviderId } from '../shared/types'
import type { AIProvider } from './providers/types'
import { GeminiProvider } from './providers/gemini'
import { ClaudeProvider } from './providers/claude'
import { OpenAIProvider } from './providers/openai'
import { MistralProvider } from './providers/mistral'
import { OllamaProvider } from './providers/ollama'

export function createProvider(
  providerId: ProviderId,
  apiKey?: string,
  model?: string,
  baseUrl?: string
): AIProvider {
  switch (providerId) {
    case 'gemini':
      return new GeminiProvider(apiKey ?? '', model)
    case 'claude':
      return new ClaudeProvider(apiKey ?? '', model)
    case 'openai':
      return new OpenAIProvider(apiKey ?? '', model)
    case 'mistral':
      return new MistralProvider(apiKey ?? '', model)
    case 'ollama':
      return new OllamaProvider(baseUrl ?? 'http://localhost:11434', model)
  }
}

export function getActiveProvider(config: Config): AIProvider {
  const providerConfig = config.providers.find((p) => p.id === config.activeProvider)
  if (!providerConfig) throw new Error('NO_PROVIDER_CONFIGURED')

  switch (config.activeProvider) {
    case 'gemini':
      if (!providerConfig.apiKey) throw new Error('NO_PROVIDER_CONFIGURED')
      return new GeminiProvider(providerConfig.apiKey, providerConfig.model || undefined)
    case 'claude':
      if (!providerConfig.apiKey) throw new Error('NO_PROVIDER_CONFIGURED')
      return new ClaudeProvider(providerConfig.apiKey, providerConfig.model || undefined)
    case 'openai':
      if (!providerConfig.apiKey) throw new Error('NO_PROVIDER_CONFIGURED')
      return new OpenAIProvider(providerConfig.apiKey, providerConfig.model || undefined)
    case 'mistral':
      if (!providerConfig.apiKey) throw new Error('NO_PROVIDER_CONFIGURED')
      return new MistralProvider(providerConfig.apiKey, providerConfig.model || undefined)
    case 'ollama':
      return new OllamaProvider(
        providerConfig.baseUrl ?? 'http://localhost:11434',
        providerConfig.model || undefined
      )
  }
}
