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
  timeoutMs: number,
  externalSignal?: AbortSignal
): Promise<Response> {
  if (externalSignal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const signal = externalSignal
    ? AbortSignal.any([controller.signal, externalSignal])
    : controller.signal
  let response: Response
  try {
    response = await fetch(url, { ...init, signal })
  } catch (err) {
    clearTimeout(timer)
    // Re-throw only when the external caller cancelled — not when our own timeout fired.
    // Checking externalSignal?.aborted at catch time is safe here because the fast-path
    // above already handles the pre-aborted case; if we reach this catch, the abort
    // happened during the fetch, and externalSignal.aborted tells us who triggered it.
    if (err instanceof DOMException && err.name === 'AbortError' && externalSignal?.aborted)
      throw err
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
  protected async callGrammar(
    system: string,
    user: string,
    _signal?: AbortSignal
  ): Promise<unknown> {
    return this.call(`${system}\n\n${user}`)
  }

  async checkGrammar(
    text: string,
    language: string,
    uiLanguage: UiLocale,
    signal?: AbortSignal
  ): Promise<GrammarError[]> {
    const { system, user } = buildGrammarPrompt(text, language, uiLanguage)
    const raw = await this.callGrammar(system, user, signal)
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
