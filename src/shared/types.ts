export type ProviderId = 'gemini' | 'claude' | 'openai' | 'ollama' | 'mistral'

export type UiLocale = 'en' | 'en-GB' | 'fr' | 'de' | 'es' | 'nl'

export type UiTheme = 'dark' | 'light'

export interface ProviderConfig {
  id: ProviderId
  apiKey?: string // absent for Ollama
  baseUrl?: string // Ollama only — default: http://localhost:11434
  model?: string // selected model; undefined = first in provider's list
}

export interface Config {
  activeProvider: ProviderId
  providers: ProviderConfig[]
  language: 'auto' | 'en-US' | 'en-GB' | 'fr-FR' | 'de-DE' | 'es-ES' | 'nl-NL'
  uiLanguage: UiLocale
  uiTheme: UiTheme
  disabledDomains: string[]
}

export interface GrammarError {
  original: string // erroneous word or phrase as it appears in the text
  replacement: string // suggested correction
  message: string // explanation shown to user
  context: string // 4–8 word surrounding phrase used to locate original
}

export type TonePreset = 'shorter' | 'formal' | 'direct' | 'technical' | 'grammar-fix'

export interface CheckGrammarMessage {
  type: 'CHECK_GRAMMAR'
  text: string
  language: string
  uiLanguage: UiLocale
}

export interface AIRewriteMessage {
  type: 'AI_REWRITE'
  text: string
  selection?: string
  language: string
  tone?: TonePreset
}

export interface TranslateMessage {
  type: 'TRANSLATE'
  text: string
  targetLanguage: string
}

export interface GetOllamaModelsMessage {
  type: 'GET_OLLAMA_MODELS'
  baseUrl: string
}

export interface GetOllamaModelsResponse {
  models: string[]
}

export interface TestConnectionMessage {
  type: 'TEST_CONNECTION'
  providerId: ProviderId
  apiKey?: string
  model?: string
  baseUrl?: string
}

export type TestConnectionResponse = { ok: true } | { ok: false; error: string }

export type BackgroundMessage =
  | CheckGrammarMessage
  | AIRewriteMessage
  | TranslateMessage
  | GetOllamaModelsMessage
  | TestConnectionMessage

export interface CheckGrammarResponse {
  errors: GrammarError[]
}

export interface AIRewriteResponse {
  rewritten: string
}

export interface TranslateResponse {
  translated: string
}

export interface ErrorResponse {
  error: string
}

export type BackgroundResponse =
  | CheckGrammarResponse
  | AIRewriteResponse
  | TranslateResponse
  | GetOllamaModelsResponse
  | TestConnectionResponse
  | ErrorResponse
