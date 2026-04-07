import { BaseProvider, FETCH_TIMEOUT_MS, fetchWithTimeout } from './base'

const BASE_URL = 'https://api.openai.com/v1/chat/completions'

export class OpenAIProvider extends BaseProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'gpt-4o-mini'
  ) {
    super()
  }

  protected override async callGrammar(
    system: string,
    user: string,
    signal?: AbortSignal
  ): Promise<unknown> {
    const response = await fetchWithTimeout(
      BASE_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: 'json_object' },
          temperature: 0,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      },
      FETCH_TIMEOUT_MS,
      signal
    )

    if (!response.ok) {
      if (response.status === 401 || response.status === 403)
        throw new Error('Invalid API key for OpenAI')
      if (response.status === 429) throw new Error('RATE_LIMIT')
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> }
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('Unexpected OpenAI API response shape')

    try {
      return JSON.parse(text.trim())
    } catch {
      return text.trim()
    }
  }

  protected async call(prompt: string): Promise<string> {
    const response = await fetchWithTimeout(
      BASE_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          messages: [{ role: 'user', content: prompt }],
        }),
      },
      FETCH_TIMEOUT_MS
    )

    if (!response.ok) {
      if (response.status === 401 || response.status === 403)
        throw new Error('Invalid API key for OpenAI')
      if (response.status === 429) throw new Error('RATE_LIMIT')
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> }
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('Unexpected OpenAI API response shape')
    return text.trim()
  }
}
