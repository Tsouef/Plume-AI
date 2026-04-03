export type ProviderId = 'gemini'

export interface ProviderConfig {
  id: ProviderId
  apiKey: string
}

export interface Config {
  activeProvider: ProviderId
  providers: ProviderConfig[]
  language: 'auto' | 'en-US' | 'en-GB' | 'fr-FR' | 'de-DE' | 'es-ES' | 'nl-NL'
  disabledDomains: string[]
}

export interface GrammarError {
  original: string      // erroneous word or phrase as it appears in the text
  replacement: string   // suggested correction
  message: string       // explanation shown to user
  context: string       // 4–8 word surrounding phrase used to locate original
}

export type TonePreset = 'shorter' | 'formal' | 'direct' | 'technical'

export interface CheckGrammarMessage {
  type: 'CHECK_GRAMMAR'
  text: string
  language: string
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

export type BackgroundMessage = CheckGrammarMessage | AIRewriteMessage | TranslateMessage

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

export type BackgroundResponse = CheckGrammarResponse | AIRewriteResponse | TranslateResponse | ErrorResponse
