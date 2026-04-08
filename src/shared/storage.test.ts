import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getConfig, STORAGE_KEY } from './storage'
import { DEFAULT_CONFIG } from './config-defaults'

const mockStorage = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}

vi.stubGlobal('chrome', {
  runtime: { id: 'test-extension-id' },
  storage: { local: mockStorage },
})

beforeEach(() => {
  vi.clearAllMocks()
  mockStorage.set.mockResolvedValue(undefined)
  mockStorage.remove.mockResolvedValue(undefined)
})

describe('getConfig — namespaced key', () => {
  it('returns merged config from namespaced key', async () => {
    const stored = {
      activeProvider: 'claude',
      providers: [{ id: 'claude', apiKey: 'sk-test' }],
      language: 'fr-FR',
    }
    mockStorage.get.mockResolvedValue({ [STORAGE_KEY]: stored })
    const config = await getConfig()
    expect(config.activeProvider).toBe('claude')
    expect(config.providers).toEqual(stored.providers)
    expect(config.language).toBe('fr-FR')
  })

  it('does not call get(null) when namespaced key exists', async () => {
    mockStorage.get.mockResolvedValue({ [STORAGE_KEY]: { activeProvider: 'mistral' } })
    await getConfig()
    expect(mockStorage.get).toHaveBeenCalledTimes(1)
    expect(mockStorage.get).toHaveBeenCalledWith(STORAGE_KEY)
  })
})

describe('getConfig — migration from flat keys', () => {
  it('migrates flat keys when namespaced key is absent', async () => {
    const flat = {
      activeProvider: 'claude',
      providers: [{ id: 'claude', apiKey: 'sk-ant' }],
      language: 'auto',
    }
    mockStorage.get
      .mockResolvedValueOnce({}) // get(STORAGE_KEY) → absent
      .mockResolvedValueOnce(flat) // get(null) → flat keys
    const config = await getConfig()
    expect(config.activeProvider).toBe('claude')
    expect(mockStorage.set).toHaveBeenCalledWith({
      [STORAGE_KEY]: expect.objectContaining({ activeProvider: 'claude' }),
    })
  })

  it('removes stale flat keys after migration', async () => {
    const flat = { activeProvider: 'claude', providers: [], language: 'auto' }
    mockStorage.get.mockResolvedValueOnce({}).mockResolvedValueOnce(flat)
    await getConfig()
    expect(mockStorage.remove).toHaveBeenCalledWith(
      expect.arrayContaining(['activeProvider', 'providers', 'language'])
    )
  })

  it('does not include extraneous keys in migrated config', async () => {
    const flat = { activeProvider: 'claude', randomChromeKey: 'garbage', someOtherKey: 42 }
    mockStorage.get.mockResolvedValueOnce({}).mockResolvedValueOnce(flat)
    const config = await getConfig()
    expect(config).not.toHaveProperty('randomChromeKey')
    expect(config).not.toHaveProperty('someOtherKey')
  })

  it('does not call remove when no flat keys are present', async () => {
    mockStorage.get.mockResolvedValueOnce({}).mockResolvedValueOnce({ someUnrelatedKey: 'value' })
    await getConfig()
    expect(mockStorage.remove).not.toHaveBeenCalled()
  })
})

describe('getConfig — default config', () => {
  it('returns DEFAULT_CONFIG when nothing is stored', async () => {
    mockStorage.get.mockResolvedValueOnce({}).mockResolvedValueOnce({})
    const config = await getConfig()
    expect(config).toEqual(DEFAULT_CONFIG)
  })

  it('returns DEFAULT_CONFIG when extension is invalid', async () => {
    vi.stubGlobal('chrome', { runtime: { id: undefined }, storage: { local: mockStorage } })
    const config = await getConfig()
    expect(config).toEqual(DEFAULT_CONFIG)
    // Restore
    vi.stubGlobal('chrome', {
      runtime: { id: 'test-extension-id' },
      storage: { local: mockStorage },
    })
  })
})
