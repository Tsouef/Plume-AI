import type { GrammarError, TonePreset, UiLocale } from '../../shared/types'
import type { AIProvider } from './types'
import { buildGrammarPrompt, buildRewritePrompt, buildToneRewritePrompt, buildTranslatePrompt, parseGrammarErrors } from './prompts'
import { REQUEST_TIMEOUT_MS } from '../../shared/constants'

const BASE_URL = 'https://api.anthropic.com/v1/messages'
const FETCH_TIMEOUT_MS = REQUEST_TIMEOUT_MS - 1_000

async function callClaude(prompt: string, apiKey: string, model: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    })
  } catch {
    clearTimeout(timer)
    throw new Error('AI service unreachable')
  }
  clearTimeout(timer)

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = body?.error?.message ?? ''
    if (response.status === 401 || response.status === 403) throw new Error(`Invalid API key for Claude${detail ? ` — ${detail}` : ''}`)
    if (response.status === 429) throw new Error('RATE_LIMIT')
    throw new Error(`Claude API error: ${response.status}${detail ? ` — ${detail}` : ''}`)
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> }
  const textBlock = data.content.find((b) => b.type === 'text')
  if (!textBlock?.text) throw new Error('Unexpected Claude API response shape')
  return textBlock.text.trim()
}

export class ClaudeProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'claude-haiku-4-5-20251001'
  ) {}

  async checkGrammar(text: string, language: string, uiLanguage: UiLocale): Promise<GrammarError[]> {
    const raw = await callClaude(buildGrammarPrompt(text, language, uiLanguage), this.apiKey, this.model)
    return parseGrammarErrors(raw)
  }

  async rewrite(text: string, selection: string | undefined, language: string, tone?: TonePreset): Promise<string> {
    const prompt = tone
      ? buildToneRewritePrompt(text, tone, language, selection)
      : buildRewritePrompt(text, selection, language)
    return callClaude(prompt, this.apiKey, this.model)
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    return callClaude(buildTranslatePrompt(text, targetLanguage), this.apiKey, this.model)
  }
}
