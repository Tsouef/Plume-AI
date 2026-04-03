import type { GrammarError, TonePreset } from '../../shared/types'

export interface GeminiResponsePart {
  thought?: boolean
  text?: string
}

export interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiResponsePart[]
    }
  }>
}

export interface AIProvider {
  checkGrammar(text: string, language: string): Promise<GrammarError[]>
  rewrite(text: string, selection: string | undefined, language: string, tone?: TonePreset): Promise<string>
  translate(text: string, targetLanguage: string): Promise<string>
}
