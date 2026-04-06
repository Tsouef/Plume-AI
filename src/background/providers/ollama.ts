import { BaseProvider, FETCH_TIMEOUT_MS, fetchWithTimeout } from './base'

export async function fetchOllamaModels(baseUrl: string): Promise<string[]> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/tags`)
  } catch {
    throw new Error('OLLAMA_UNREACHABLE')
  }
  if (!response.ok) throw new Error('OLLAMA_UNREACHABLE')
  const data = (await response.json()) as { models: Array<{ name: string }> }
  return data.models.map((m) => m.name)
}

export class OllamaProvider extends BaseProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly model: string = ''
  ) {
    super()
  }

  protected override async callGrammar(system: string, user: string): Promise<unknown> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          format: 'json',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          stream: false,
        }),
      },
      FETCH_TIMEOUT_MS
    )

    if (!response.ok) {
      if (response.status === 429) throw new Error('RATE_LIMIT')
      const body = await response.json().catch(() => null)
      const detail = body?.error ?? ''
      throw new Error(`Ollama API error: ${response.status}${detail ? ` — ${detail}` : ''}`)
    }

    const data = (await response.json()) as { message: { content: string } }
    const text = data.message?.content
    if (!text) throw new Error('Unexpected Ollama API response shape')

    try {
      return JSON.parse(text.trim())
    } catch {
      return text.trim()
    }
  }

  protected async call(prompt: string): Promise<string> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/api/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
      },
      FETCH_TIMEOUT_MS
    )

    if (!response.ok) {
      if (response.status === 429) throw new Error('RATE_LIMIT')
      const body = await response.json().catch(() => null)
      const detail = body?.error ?? ''
      throw new Error(`Ollama API error: ${response.status}${detail ? ` — ${detail}` : ''}`)
    }

    const data = (await response.json()) as { message: { content: string } }
    const text = data.message?.content
    if (!text) throw new Error('Unexpected Ollama API response shape')
    return text.trim()
  }
}
