import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeminiProvider } from './gemini'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

describe('GeminiProvider.checkGrammar', () => {
  it('throws "Invalid API key for Gemini" on 400', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 400 }))
    const provider = new GeminiProvider('bad-key')
    await expect(provider.checkGrammar('test', 'auto')).rejects.toThrow('Invalid API key for Gemini')
  })

  it('throws "AI service unreachable" on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))
    const provider = new GeminiProvider('key')
    await expect(provider.checkGrammar('test', 'auto')).rejects.toThrow('AI service unreachable')
  })

  it('sends thinkingConfig with thinkingBudget 0 to disable overthinking', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '[]' }] } }] }),
        { status: 200 }
      )
    )
    const provider = new GeminiProvider('key')
    await provider.checkGrammar('text', 'auto')
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.generationConfig?.thinkingConfig?.thinkingBudget).toBe(0)
  })

  it('passes API key as query param', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '[]' }] } }] }),
        { status: 200 }
      )
    )
    const provider = new GeminiProvider('my-key')
    await provider.checkGrammar('text', 'auto')
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('?key=my-key')
  })

  it('returns parsed errors on success', async () => {
    const errors = [
      { original: 'are', replacement: 'is', message: 'SVA', context: 'data are wrong' },
    ]
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(errors) }] } }] }),
        { status: 200 }
      )
    )
    const provider = new GeminiProvider('key')
    const result = await provider.checkGrammar('The data are wrong', 'auto')
    expect(result).toHaveLength(1)
    expect(result[0].original).toBe('are')
  })

  it('returns empty array when AI returns []', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '[]' }] } }] }),
        { status: 200 }
      )
    )
    const provider = new GeminiProvider('key')
    expect(await provider.checkGrammar('Correct text', 'auto')).toEqual([])
  })
})

describe('GeminiProvider.rewrite', () => {
  it('returns trimmed rewritten text', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '  Fixed.  ' }] } }] }),
        { status: 200 }
      )
    )
    const provider = new GeminiProvider('key')
    expect(await provider.rewrite('Broken', undefined, 'auto')).toBe('Fixed.')
  })
})

describe('GeminiProvider.translate', () => {
  it('returns trimmed translated text', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: '  Hello world.  ' }] } }] }),
        { status: 200 }
      )
    )
    const provider = new GeminiProvider('key')
    expect(await provider.translate('Bonjour le monde', 'en-US')).toBe('Hello world.')
  })
})
