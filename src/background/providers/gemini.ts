import type { GrammarError, TonePreset } from '../../shared/types'
import type { AIProvider, GeminiApiResponse } from './types'
import { buildGrammarPrompt, buildRewritePrompt, buildToneRewritePrompt, buildTranslatePrompt, parseGrammarErrors } from './prompts'

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
      }),
    })
  } catch {
    throw new Error('AI service unreachable')
  }

  if (!response.ok) {
    console.error(`[Gemini] ${response.status}`)
    if (response.status === 400 || response.status === 403) throw new Error('Invalid API key for Gemini')
    if (response.status === 429) throw new Error('RATE_LIMIT')
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data: GeminiApiResponse = await response.json()
  const parts = data.candidates?.[0]?.content?.parts
  const textPart = Array.isArray(parts) ? parts.find((p) => !p.thought && p.text) : undefined
  if (!textPart?.text) throw new Error('Unexpected Gemini API response shape')
  return textPart.text.trim()
}

export class GeminiProvider implements AIProvider {
  constructor(private readonly apiKey: string) {}

  async checkGrammar(text: string, language: string): Promise<GrammarError[]> {
    const raw = await callGemini(buildGrammarPrompt(text, language), this.apiKey)
    return parseGrammarErrors(raw)
  }

  async rewrite(text: string, selection: string | undefined, language: string, tone?: TonePreset): Promise<string> {
    const prompt = tone
      ? buildToneRewritePrompt(text, tone, language, selection)
      : buildRewritePrompt(text, selection, language)
    return callGemini(prompt, this.apiKey)
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    return callGemini(buildTranslatePrompt(text, targetLanguage), this.apiKey)
  }
}
