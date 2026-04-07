import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { DEFAULT_CONFIG } from '../../shared/config-defaults'

vi.mock('../utils/messaging', () => ({ sendBackgroundMessage: vi.fn() }))
vi.mock('../utils/ai-rewrite', () => ({ requestAIRewrite: vi.fn() }))
vi.mock('../utils/text-apply', () => ({ applyAI: vi.fn() }))

// Mock useFieldDetector to return a stable non-null field so that
// the "close panel when activeField is null" effect never triggers.
let mockActiveField: HTMLElement | null = null
vi.mock('./useFieldDetector', () => ({
  useFieldDetector: () => mockActiveField,
}))

import { sendBackgroundMessage } from '../utils/messaging'
import { usePanelOrchestration } from './usePanelOrchestration'

const mockSend = vi.mocked(sendBackgroundMessage)

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('chrome', { runtime: { id: 'test-ext', openOptionsPage: vi.fn() } })
  mockSend.mockResolvedValue({ errors: [] })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  mockSend.mockReset()
  mockActiveField = null
})

function makeField(text = 'the quick brown fox jumps over lazy dog'): HTMLDivElement {
  const div = document.createElement('div')
  div.contentEditable = 'true'
  div.textContent = text
  document.body.appendChild(div)
  return div
}

describe('usePanelOrchestration — manualOnly', () => {
  it('does NOT fire grammar re-check on input when manualOnly is true', async () => {
    const field = makeField()
    mockActiveField = field
    const { result } = renderHook(() =>
      usePanelOrchestration({ ...DEFAULT_CONFIG, manualOnly: true })
    )

    act(() => {
      result.current.openPanel(field)
    })
    // Exhaust debounce for the initial panel-open check
    await vi.advanceTimersByTimeAsync(2000)
    await Promise.resolve()
    await Promise.resolve()
    mockSend.mockClear()

    // Edit field content with enough change to bypass isSmallDiff (≥ 3 chars)
    field.textContent = 'the quick brown fox jumps over lazy dog plus more words here'
    act(() => {
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await vi.advanceTimersByTimeAsync(2000)
    await Promise.resolve()
    await Promise.resolve()

    expect(mockSend).not.toHaveBeenCalled()

    document.body.removeChild(field)
  })

  it('fires grammar re-check on input when manualOnly is false', async () => {
    const field = makeField()
    mockActiveField = field
    const { result } = renderHook(() =>
      usePanelOrchestration({ ...DEFAULT_CONFIG, manualOnly: false })
    )

    act(() => {
      result.current.openPanel(field)
    })
    await vi.advanceTimersByTimeAsync(2000)
    await Promise.resolve()
    await Promise.resolve()
    mockSend.mockClear()

    // Change ≥ 3 chars so isSmallDiff returns false
    field.textContent = 'the quick brown fox jumps over lazy dog plus more words here'
    act(() => {
      field.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await vi.advanceTimersByTimeAsync(2000)
    await Promise.resolve()
    await Promise.resolve()

    expect(mockSend).toHaveBeenCalledTimes(1)

    document.body.removeChild(field)
  })
})
