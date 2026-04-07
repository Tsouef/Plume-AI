// Regression: ISSUE-002 — "Disable for site" button does nothing when
// chrome.permissions.remove() returns false (e.g., permission was never
// explicitly granted as optional, or domain added via config directly).
// Commit 9a6520f introduced `if (!removed) return` which blocked the state update.
// The trustedDomains list in config is the source of truth — its update must
// not be gated on the permission removal outcome.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { DEFAULT_CONFIG } from '../shared/config-defaults'

const mockPermissionsRemove = vi.fn()
const mockTabsQuery = vi.fn()
const mockStorageSet = vi.fn()

const STORED_CONFIG = { ...DEFAULT_CONFIG, trustedDomains: ['example.com'] }

vi.stubGlobal('chrome', {
  storage: {
    local: {
      // Returns { config: <stored> } when key is 'config', {} otherwise
      get: vi.fn().mockImplementation((key) => {
        if (key === 'config') return Promise.resolve({ config: STORED_CONFIG })
        return Promise.resolve({})
      }),
      set: mockStorageSet.mockImplementation(() => Promise.resolve()),
      remove: vi.fn().mockResolvedValue(undefined),
    },
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue({}),
    },
    onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  runtime: {
    sendMessage: vi.fn().mockResolvedValue({ models: [] }),
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    lastError: null,
    id: 'test-id',
  },
  tabs: {
    query: mockTabsQuery,
  },
  permissions: {
    request: vi.fn().mockResolvedValue(true),
    remove: mockPermissionsRemove,
  },
})

describe('App — disable-for-site regression (ISSUE-002)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTabsQuery.mockResolvedValue([{ url: 'https://example.com/page' }])
    mockStorageSet.mockResolvedValue(undefined)
    // Restore storage.local.get after clearAllMocks wipes it
    ;(chrome.storage.local.get as ReturnType<typeof vi.fn>).mockImplementation((key: unknown) => {
      if (key === 'config') return Promise.resolve({ config: STORED_CONFIG })
      return Promise.resolve({})
    })
  })

  it('removes domain from trustedDomains even when chrome.permissions.remove returns false', async () => {
    // Precondition: permission revocation "fails" — the case that triggered the bug
    mockPermissionsRemove.mockResolvedValue(false)

    const { default: App } = await import('./App')

    await act(async () => {
      render(<App />)
    })

    // SitePermissionSection resolves current tab domain async — wait for it
    const disableBtn = await screen.findByRole('button', { name: 'Disable' })
    expect(disableBtn).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(disableBtn)
    })

    // Domain must be removed from trustedDomains in the saved config
    await waitFor(() => {
      expect(mockStorageSet).toHaveBeenCalled()
      const savedArg = mockStorageSet.mock.calls.at(-1)?.[0] as {
        config?: { trustedDomains?: string[] }
      }
      expect(savedArg?.config?.trustedDomains).not.toContain('example.com')
    })
  })

  it('removes domain from trustedDomains when chrome.permissions.remove returns true', async () => {
    mockPermissionsRemove.mockResolvedValue(true)

    const { default: App } = await import('./App')

    await act(async () => {
      render(<App />)
    })

    const disableBtn = await screen.findByRole('button', { name: 'Disable' })

    await act(async () => {
      fireEvent.click(disableBtn)
    })

    await waitFor(() => {
      expect(mockStorageSet).toHaveBeenCalled()
      const savedArg = mockStorageSet.mock.calls.at(-1)?.[0] as {
        config?: { trustedDomains?: string[] }
      }
      expect(savedArg?.config?.trustedDomains).not.toContain('example.com')
    })
  })
})
