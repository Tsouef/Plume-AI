import type { GrammarError, TonePreset, UiLocale } from '../../shared/types'
import type { AIProvider } from './types'
import {
  buildGrammarPrompt,
  buildRewritePrompt,
  buildToneRewritePrompt,
  buildTranslatePrompt,
  parseGrammarErrors,
} from './prompts'
import { REQUEST_TIMEOUT_MS } from '../../shared/constants'

export const FETCH_TIMEOUT_MS = REQUEST_TIMEOUT_MS - 1_000

export async function fetchWithTimeout(
  url: string,
  init: Parameters<typeof fetch>[1],
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response: Response
  try {
    response = await fetch(url, { ...init, signal: controller.signal })
  } catch {
    clearTimeout(timer)
    throw new Error('AI service unreachable')
  }
  clearTimeout(timer)
  return response
}

export abstract class BaseProvider implements AIProvider {
  protected abstract call(prompt: string): Promise<string>

  /**
   * Override in subclasses to use native system-prompt support and JSON mode.
   * Default: concatenates system + user and calls this.call().
   */
  protected async callGrammar(system: string, user: string): Promise<unknown> {
    return this.call(`${system}\n\n${user}`)
  }

  async checkGrammar(
    text: string,
    language: string,
    uiLanguage: UiLocale
  ): Promise<GrammarError[]> {
    const { system, user } = buildGrammarPrompt(text, language, uiLanguage)
    const raw = await this.callGrammar(system, user)
    return parseGrammarErrors(raw)
  }

  async rewrite(
    text: string,
    selection: string | undefined,
    language: string,
    tone?: TonePreset
  ): Promise<string> {
    const prompt = tone
      ? buildToneRewritePrompt(text, tone, language, selection)
      : buildRewritePrompt(text, selection, language)
    return this.call(prompt)
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    return this.call(buildTranslatePrompt(text, targetLanguage))
  }
}
