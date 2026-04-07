import { BaseProvider, FETCH_TIMEOUT_MS, fetchWithTimeout } from './base'

const BASE_URL = 'https://api.anthropic.com/v1/messages'

export class ClaudeProvider extends BaseProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'claude-haiku-4-5-20251001'
  ) {
    super()
  }

  private async post(
    messages: Array<{ role: string; content: string }>,
    system?: string,
    signal?: AbortSignal
  ): Promise<string> {
    const response = await fetchWithTimeout(
      BASE_URL,
      {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          ...(system !== undefined && { system }),
          messages,
        }),
      },
      FETCH_TIMEOUT_MS,
      signal
    )

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      const detail = body?.error?.message ?? ''
      if (response.status === 401 || response.status === 403)
        throw new Error(`Invalid API key for Claude${detail ? ` — ${detail}` : ''}`)
      if (response.status === 429) throw new Error('RATE_LIMIT')
      throw new Error(`Claude API error: ${response.status}${detail ? ` — ${detail}` : ''}`)
    }

    const data = (await response.json()) as { content: Array<{ type: string; text: string }> }
    const textBlock = data.content.find((b) => b.type === 'text')
    if (!textBlock?.text) throw new Error('Unexpected Claude API response shape')
    return textBlock.text.trim()
  }

  protected override async callGrammar(
    system: string,
    user: string,
    signal?: AbortSignal
  ): Promise<unknown> {
    return this.post([{ role: 'user', content: user }], system, signal)
  }

  protected async call(prompt: string): Promise<string> {
    return this.post([{ role: 'user', content: prompt }])
  }
}
