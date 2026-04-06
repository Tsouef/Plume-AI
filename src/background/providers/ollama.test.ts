import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OllamaProvider, fetchOllamaModels } from './ollama'

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

const chatResponse = (text: string) =>
  new Response(JSON.stringify({ message: { role: 'assistant', content: text } }), { status: 200 })

describe('OllamaProvider.checkGrammar', () => {
  it('throws "AI service unreachable" on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))
    const provider = new OllamaProvider('http://localhost:11434')
    await expect(provider.checkGrammar('test', 'auto', 'en')).rejects.toThrow(
      'AI service unreachable'
    )
  })

  it('calls {baseUrl}/api/chat', async () => {
    vi.mocked(fetch).mockResolvedValue(chatResponse('[]'))
    const provider = new OllamaProvider('http://localhost:11434')
    await provider.checkGrammar('text', 'auto', 'en')
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toBe('http://localhost:11434/api/chat')
  })

  it('uses custom model in request body', async () => {
    vi.mocked(fetch).mockResolvedValue(chatResponse('[]'))
    const provider = new OllamaProvider('http://localhost:11434', 'llama3.2')
    await provider.checkGrammar('text', 'auto', 'en')
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.model).toBe('llama3.2')
  })

  it('sets stream: false in request body', async () => {
    vi.mocked(fetch).mockResolvedValue(chatResponse('[]'))
    const provider = new OllamaProvider('http://localhost:11434')
    await provider.checkGrammar('text', 'auto', 'en')
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.stream).toBe(false)
  })

  it('returns parsed errors on success', async () => {
    const errors = [
      { original: 'are', replacement: 'is', message: 'SVA', context: 'data are wrong' },
    ]
    vi.mocked(fetch).mockResolvedValue(chatResponse(JSON.stringify(errors)))
    const provider = new OllamaProvider('http://localhost:11434')
    expect(await provider.checkGrammar('data are wrong', 'auto', 'en')).toEqual(errors)
  })
})

describe('OllamaProvider.rewrite', () => {
  it('returns trimmed rewritten text', async () => {
    vi.mocked(fetch).mockResolvedValue(chatResponse('  Fixed.  '))
    const provider = new OllamaProvider('http://localhost:11434')
    expect(await provider.rewrite('Broken', undefined, 'auto')).toBe('Fixed.')
  })
})

describe('OllamaProvider.translate', () => {
  it('returns trimmed translated text', async () => {
    vi.mocked(fetch).mockResolvedValue(chatResponse('  Hello.  '))
    const provider = new OllamaProvider('http://localhost:11434')
    expect(await provider.translate('Bonjour', 'en-US')).toBe('Hello.')
  })
})

describe('OllamaProvider — grammar system prompt', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  const okResponse = () =>
    new Response(JSON.stringify({ message: { content: '[]' } }), { status: 200 })

  it('sends system message as first message in array', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse())
    await new OllamaProvider('http://localhost:11434', 'llama3').checkGrammar('test', 'auto', 'en')
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[0].content).toBeTypeOf('string')
  })

  it('sets format to "json" for grammar checks', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse())
    await new OllamaProvider('http://localhost:11434', 'llama3').checkGrammar('test', 'auto', 'en')
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)
    expect(body.format).toBe('json')
  })
})

describe('fetchOllamaModels', () => {
  it('returns model names from /api/tags', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ models: [{ name: 'llama3.2:latest' }, { name: 'mistral:latest' }] }),
        { status: 200 }
      )
    )
    const models = await fetchOllamaModels('http://localhost:11434')
    expect(models).toEqual(['llama3.2:latest', 'mistral:latest'])
  })

  it('calls {baseUrl}/api/tags', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ models: [] }), { status: 200 })
    )
    await fetchOllamaModels('http://localhost:11434')
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('http://localhost:11434/api/tags')
  })

  it('throws "OLLAMA_UNREACHABLE" on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network'))
    await expect(fetchOllamaModels('http://localhost:11434')).rejects.toThrow('OLLAMA_UNREACHABLE')
  })

  it('throws "OLLAMA_UNREACHABLE" on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 500 }))
    await expect(fetchOllamaModels('http://localhost:11434')).rejects.toThrow('OLLAMA_UNREACHABLE')
  })
})
