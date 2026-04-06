import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeminiProvider } from './gemini'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

describe('GeminiProvider.checkGrammar', () => {
  it('throws "Invalid API key for Gemini" on 400', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 400 }))
    const provider = new GeminiProvider('bad-key')
    await expect(provider.checkGrammar('test', 'auto', 'en')).rejects.toThrow(
      'Invalid API key for Gemini'
    )
  })

  it('throws "AI service unreachable" on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))
    const provider = new GeminiProvider('key')
    await expect(provider.checkGrammar('test', 'auto', 'en')).rejects.toThrow(
      'AI service unreachable'
    )
  })

  it('sends thinkingConfig with thinkingBudget 0 to disable overthinking', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '[]' }] } }] }), {
        status: 200,
      })
    )
    const provider = new GeminiProvider('key')
    await provider.checkGrammar('text', 'auto', 'en')
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.generationConfig?.thinkingConfig?.thinkingBudget).toBe(0)
  })

  it('passes API key as query param', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '[]' }] } }] }), {
        status: 200,
      })
    )
    const provider = new GeminiProvider('my-key')
    await provider.checkGrammar('text', 'auto', 'en')
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('?key=my-key')
  })

  it('returns parsed errors on success', async () => {
    const errors = [
      { original: 'are', replacement: 'is', message: 'SVA', context: 'data are wrong' },
    ]
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(errors) }] } }],
        }),
        { status: 200 }
      )
    )
    const provider = new GeminiProvider('key')
    const result = await provider.checkGrammar('The data are wrong', 'auto', 'en')
    expect(result).toHaveLength(1)
    expect(result[0].original).toBe('are')
  })

  it('returns empty array when AI returns []', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '[]' }] } }] }), {
        status: 200,
      })
    )
    const provider = new GeminiProvider('key')
    expect(await provider.checkGrammar('Correct text', 'auto', 'en')).toEqual([])
  })

  it('uses custom model in request URL', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '[]' }] } }] }), {
        status: 200,
      })
    )
    const provider = new GeminiProvider('key', 'gemini-2.5-pro')
    await provider.checkGrammar('text', 'auto', 'en')
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('gemini-2.5-pro')
  })

  it('sends systemInstruction in the request body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '[]' }] } }] }), {
        status: 200,
      })
    )
    const provider = new GeminiProvider('key')
    await provider.checkGrammar('text', 'auto', 'en')
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.systemInstruction?.parts?.[0]?.text).toBeTypeOf('string')
    expect((body.systemInstruction.parts[0].text as string).length).toBeGreaterThan(10)
  })

  it('enables JSON output mode in generationConfig', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '[]' }] } }] }), {
        status: 200,
      })
    )
    const provider = new GeminiProvider('key')
    await provider.checkGrammar('text', 'auto', 'en')
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.generationConfig?.responseMimeType).toBe('application/json')
  })

  it('user message contains only the text and language instruction, not the rules', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '[]' }] } }] }), {
        status: 200,
      })
    )
    const provider = new GeminiProvider('key')
    await provider.checkGrammar('my test input', 'auto', 'en')
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    const userText: string = body.contents[0].parts[0].text
    expect(userText).toContain('my test input')
    expect(userText).not.toContain('false cognates')
  })

  it('aborts fetch after timeout and throws', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      (_url: string, opts?: globalThis.RequestInit) =>
        new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        })
    )

    const provider = new GeminiProvider('valid-key')
    const resultPromise = provider.checkGrammar('hello', 'en-US', 'en').catch((e: Error) => e)

    // Advance past the 44 s abort timeout (REQUEST_TIMEOUT_MS - 1000) and flush microtasks
    await vi.advanceTimersByTimeAsync(44_001)

    const result = await resultPromise
    expect(result).toBeInstanceOf(Error)
    expect((result as Error).message).toBe('AI service unreachable')
    vi.useRealTimers()
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
