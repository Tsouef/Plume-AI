import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGrammarCheck } from './useGrammarCheck'
import * as grammarModule from '../utils/grammar'
import { GRAMMAR_DEBOUNCE_MS } from '../../shared/constants'

vi.mock('../utils/grammar', () => ({
  createGrammarChecker: vi.fn(),
}))

const mockCreateChecker = vi.mocked(grammarModule.createGrammarChecker)

beforeEach(() => {
  vi.stubGlobal('chrome', { runtime: { id: 'test-ext' } })
  mockCreateChecker.mockReset()
})

function makeChecker() {
  const check = vi.fn()
  const cancel = vi.fn()
  mockCreateChecker.mockReturnValue({ check, cancel })
  return { check, cancel }
}

describe('useGrammarCheck', () => {
  it('creates a grammar checker with correct params', () => {
    const { check, cancel } = makeChecker()
    const onResults = vi.fn()
    const onError = vi.fn()

    renderHook(() =>
      useGrammarCheck({ language: 'en-US', uiLanguage: 'en', onResults, onError, delay: 500 })
    )

    expect(mockCreateChecker).toHaveBeenCalledWith(
      'en-US',
      'en',
      expect.any(Function),
      expect.any(Function),
      500,
      expect.any(Function),
      expect.any(Function)
    )
    expect(check).not.toHaveBeenCalled()
    expect(cancel).not.toHaveBeenCalled()
  })

  it('returned callback delegates to checker.check', () => {
    const { check } = makeChecker()
    const { result } = renderHook(() =>
      useGrammarCheck({ language: 'en', uiLanguage: 'en', onResults: vi.fn(), onError: vi.fn() })
    )

    act(() => {
      result.current('Hello world')
    })

    expect(check).toHaveBeenCalledWith('Hello world', false)
  })

  it('cancels checker on unmount', () => {
    const { cancel } = makeChecker()
    const { unmount } = renderHook(() =>
      useGrammarCheck({ language: 'en', uiLanguage: 'en', onResults: vi.fn(), onError: vi.fn() })
    )

    unmount()
    expect(cancel).toHaveBeenCalled()
  })

  it('recreates checker when language changes', () => {
    const { cancel: cancel1 } = makeChecker()
    const { rerender } = renderHook(
      ({ language }: { language: string }) =>
        useGrammarCheck({ language, uiLanguage: 'en', onResults: vi.fn(), onError: vi.fn() }),
      { initialProps: { language: 'en' } }
    )

    makeChecker()
    rerender({ language: 'fr' })

    expect(cancel1).toHaveBeenCalled()
    expect(mockCreateChecker).toHaveBeenCalledTimes(2)
    expect(mockCreateChecker).toHaveBeenLastCalledWith(
      'fr',
      'en',
      expect.any(Function),
      expect.any(Function),
      GRAMMAR_DEBOUNCE_MS,
      expect.any(Function),
      expect.any(Function)
    )
  })

  it('returned callback is stable across re-renders', () => {
    makeChecker()
    const { result, rerender } = renderHook(() =>
      useGrammarCheck({ language: 'en', uiLanguage: 'en', onResults: vi.fn(), onError: vi.fn() })
    )

    const firstCallback = result.current
    rerender()
    expect(result.current).toBe(firstCallback)
  })
})
