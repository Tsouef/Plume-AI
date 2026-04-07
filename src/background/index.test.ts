import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

// vi.hoisted runs before any module is evaluated, allowing us to stub chrome
// before index.ts registers chrome.runtime.onMessage.addListener at module load time.
const { captureOnUpdated } = vi.hoisted(() => {
  const onUpdatedAddListener = vi.fn()
  vi.stubGlobal('chrome', {
    commands: {
      onCommand: { addListener: vi.fn() },
    },
    tabs: {
      onUpdated: { addListener: onUpdatedAddListener },
    },
    runtime: {
      id: 'test-ext',
      onMessage: { addListener: vi.fn() },
    },
  })
  return { captureOnUpdated: onUpdatedAddListener }
})

import { handleMessage } from './index'
import { DEFAULT_CONFIG } from '../shared/config-defaults'

vi.mock('./provider-factory', () => ({
  getActiveProvider: vi.fn(),
  createProvider: vi.fn(),
}))
vi.mock('../shared/storage', () => ({
  getConfig: vi.fn(),
}))
vi.mock('./providers/ollama', () => ({
  fetchOllamaModels: vi.fn(),
}))

import { getActiveProvider, createProvider } from './provider-factory'
import { getConfig } from '../shared/storage'
import { fetchOllamaModels } from './providers/ollama'

const mockGetProvider = vi.mocked(getActiveProvider)
const mockGetConfig = vi.mocked(getConfig)
const mockFetchModels = vi.mocked(fetchOllamaModels)

function makeProvider() {
  const provider = {
    checkGrammar: vi.fn(),
    rewrite: vi.fn(),
    translate: vi.fn(),
  }
  mockGetProvider.mockReturnValue(provider)
  return provider
}

beforeEach(() => {
  vi.stubGlobal('chrome', { runtime: { id: 'test-ext' } })
  mockGetConfig.mockResolvedValue({
    provider: 'claude',
    apiKey: 'key',
    model: 'claude-haiku-4-5-20251001',
    language: 'en',
    uiLanguage: 'en',
    theme: 'dark',
    disabledSites: [],
    ollamaBaseUrl: '',
  } as never)
  mockGetProvider.mockReset()
  mockFetchModels.mockReset()
  vi.mocked(createProvider).mockReset()
})

describe('handleMessage — CHECK_GRAMMAR', () => {
  it('returns errors from provider.checkGrammar', async () => {
    const errors = [{ original: 'is', replacement: 'are', message: 'SVA', context: 'test' }]
    const provider = makeProvider()
    provider.checkGrammar.mockResolvedValue(errors)

    const result = await handleMessage({
      type: 'CHECK_GRAMMAR',
      text: 'test',
      language: 'en',
      uiLanguage: 'en',
    })

    expect(result).toEqual({ errors })
    expect(provider.checkGrammar).toHaveBeenCalledWith('test', 'en', 'en', expect.any(AbortSignal))
  })

  it('passes an AbortSignal to provider.checkGrammar', async () => {
    const provider = makeProvider()
    provider.checkGrammar.mockResolvedValue([])

    await handleMessage({
      type: 'CHECK_GRAMMAR',
      text: 'test',
      language: 'en',
      uiLanguage: 'en',
    })

    expect(provider.checkGrammar).toHaveBeenCalledWith('test', 'en', 'en', expect.any(AbortSignal))
  })

  it('returns { errors: [] } when grammar check throws AbortError', async () => {
    const provider = makeProvider()
    const abortError = new DOMException('Aborted', 'AbortError')
    provider.checkGrammar.mockRejectedValue(abortError)

    const result = await handleMessage({
      type: 'CHECK_GRAMMAR',
      text: 'test',
      language: 'en',
      uiLanguage: 'en',
    })

    expect(result).toEqual({ errors: [] })
  })
})

describe('handleMessage — AI_REWRITE', () => {
  it('returns rewritten text', async () => {
    const provider = makeProvider()
    provider.rewrite.mockResolvedValue('Better text')

    const result = await handleMessage({
      type: 'AI_REWRITE',
      text: 'Some text',
      selection: undefined,
      language: 'en',
    })

    expect(result).toEqual({ rewritten: 'Better text' })
    expect(provider.rewrite).toHaveBeenCalledWith('Some text', undefined, 'en', undefined)
  })

  it('passes tone to provider', async () => {
    const provider = makeProvider()
    provider.rewrite.mockResolvedValue('Formal text')

    await handleMessage({
      type: 'AI_REWRITE',
      text: 'text',
      selection: undefined,
      language: 'en',
      tone: 'formal',
    })

    expect(provider.rewrite).toHaveBeenCalledWith('text', undefined, 'en', 'formal')
  })
})

describe('handleMessage — TRANSLATE', () => {
  it('returns translated text', async () => {
    const provider = makeProvider()
    provider.translate.mockResolvedValue('Texte traduit')

    const result = await handleMessage({
      type: 'TRANSLATE',
      text: 'Some text',
      targetLanguage: 'fr',
    })

    expect(result).toEqual({ translated: 'Texte traduit' })
  })
})

describe('handleMessage — GET_OLLAMA_MODELS', () => {
  it('returns model list on success', async () => {
    mockFetchModels.mockResolvedValue(['llama3', 'mistral'])

    const result = await handleMessage({
      type: 'GET_OLLAMA_MODELS',
      baseUrl: 'http://localhost:11434',
    })

    expect(result).toEqual({ models: ['llama3', 'mistral'] })
  })

  it('returns empty array when fetchOllamaModels throws', async () => {
    mockFetchModels.mockRejectedValue(new Error('OLLAMA_UNREACHABLE'))

    const result = await handleMessage({
      type: 'GET_OLLAMA_MODELS',
      baseUrl: 'http://localhost:11434',
    })

    expect(result).toEqual({ models: [] })
  })
})

const mockCreateProvider = vi.mocked(createProvider)

describe('handleMessage — TEST_CONNECTION', () => {
  it('returns { ok: true } when provider.translate returns a non-empty string', async () => {
    mockCreateProvider.mockReturnValue({
      checkGrammar: vi.fn(),
      rewrite: vi.fn(),
      translate: vi.fn().mockResolvedValue('ok'),
    })

    const result = await handleMessage({
      type: 'TEST_CONNECTION',
      providerId: 'claude',
      apiKey: 'test-key',
    })
    expect(result).toEqual({ ok: true })
  })

  it('returns { ok: false, error } when provider.translate throws', async () => {
    mockCreateProvider.mockReturnValue({
      checkGrammar: vi.fn(),
      rewrite: vi.fn(),
      translate: vi.fn().mockRejectedValue(new Error('Invalid API key')),
    })

    const result = await handleMessage({
      type: 'TEST_CONNECTION',
      providerId: 'claude',
      apiKey: 'bad-key',
    })
    expect(result).toEqual({ ok: false, error: 'Invalid API key' })
  })
})

describe('tabs.onUpdated — trusted domain auto-inject', () => {
  let onUpdatedHandler: (
    tabId: number,
    changeInfo: Record<string, unknown>,
    tab: { url?: string }
  ) => Promise<void>

  beforeAll(() => {
    onUpdatedHandler = captureOnUpdated.mock.calls[0][0]
  })

  it('injects content script when tab finishes loading on a trusted domain', async () => {
    const execScript = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('chrome', {
      scripting: { executeScript: execScript },
      runtime: { id: 'test-ext' },
    })
    mockGetConfig.mockResolvedValue({
      ...DEFAULT_CONFIG,
      trustedDomains: ['example.com'],
    } as never)

    await onUpdatedHandler(42, { status: 'complete' }, { url: 'https://example.com/page' })

    expect(execScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ['src/content/index.tsx'],
    })
  })

  it('does not inject when domain is not in trustedDomains', async () => {
    const execScript = vi.fn()
    vi.stubGlobal('chrome', {
      scripting: { executeScript: execScript },
      runtime: { id: 'test-ext' },
    })
    mockGetConfig.mockResolvedValue({
      ...DEFAULT_CONFIG,
      trustedDomains: [],
    } as never)

    await onUpdatedHandler(42, { status: 'complete' }, { url: 'https://example.com/page' })

    expect(execScript).not.toHaveBeenCalled()
  })

  it('does not inject when changeInfo.status is not "complete"', async () => {
    const execScript = vi.fn()
    vi.stubGlobal('chrome', {
      scripting: { executeScript: execScript },
      runtime: { id: 'test-ext' },
    })
    mockGetConfig.mockResolvedValue({
      ...DEFAULT_CONFIG,
      trustedDomains: ['example.com'],
    } as never)

    await onUpdatedHandler(42, { status: 'loading' }, { url: 'https://example.com/page' })

    expect(execScript).not.toHaveBeenCalled()
  })

  it('does not inject on non-http(s) URLs', async () => {
    const execScript = vi.fn()
    vi.stubGlobal('chrome', {
      scripting: { executeScript: execScript },
      runtime: { id: 'test-ext' },
    })
    mockGetConfig.mockResolvedValue({
      ...DEFAULT_CONFIG,
      trustedDomains: ['newtab'],
    } as never)

    await onUpdatedHandler(42, { status: 'complete' }, { url: 'chrome://newtab/' })

    expect(execScript).not.toHaveBeenCalled()
  })
})
