import type { GeminiApiResponse } from './types'
import { BaseProvider, FETCH_TIMEOUT_MS, fetchWithTimeout } from './base'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export class GeminiProvider extends BaseProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'gemini-2.0-flash-lite'
  ) {
    super()
  }

  protected override async callGrammar(system: string, user: string): Promise<unknown> {
    const response = await fetchWithTimeout(
      `${GEMINI_BASE}/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ parts: [{ text: user }] }],
          generationConfig: {
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: 'application/json',
          },
        }),
      },
      FETCH_TIMEOUT_MS
    )

    if (!response.ok) {
      console.error(`[Gemini] ${response.status}`)
      if (response.status === 400 || response.status === 403)
        throw new Error('Invalid API key for Gemini')
      if (response.status === 429) throw new Error('RATE_LIMIT')
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data: GeminiApiResponse = await response.json()
    const parts = data.candidates?.[0]?.content?.parts
    const textPart = Array.isArray(parts) ? parts.find((p) => !p.thought && p.text) : undefined
    if (!textPart?.text) throw new Error('Unexpected Gemini API response shape')

    try {
      return JSON.parse(textPart.text.trim())
    } catch {
      return textPart.text.trim()
    }
  }

  protected async call(prompt: string): Promise<string> {
    const response = await fetchWithTimeout(
      `${GEMINI_BASE}/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
        }),
      },
      FETCH_TIMEOUT_MS
    )

    if (!response.ok) {
      console.error(`[Gemini] ${response.status}`)
      if (response.status === 400 || response.status === 403)
        throw new Error('Invalid API key for Gemini')
      if (response.status === 429) throw new Error('RATE_LIMIT')
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data: GeminiApiResponse = await response.json()
    const parts = data.candidates?.[0]?.content?.parts
    const textPart = Array.isArray(parts) ? parts.find((p) => !p.thought && p.text) : undefined
    if (!textPart?.text) throw new Error('Unexpected Gemini API response shape')
    return textPart.text.trim()
  }
}
