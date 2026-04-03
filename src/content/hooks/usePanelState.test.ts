import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePanelState } from './usePanelState'
import { makeError } from '../../test-utils/grammar-error'

describe('usePanelState', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => usePanelState())
    expect(result.current.state.type).toBe('idle')
  })

  it('transitions to checking', () => {
    const { result } = renderHook(() => usePanelState())
    act(() => result.current.setChecking())
    expect(result.current.state.type).toBe('checking')
  })

  it('transitions to results', () => {
    const { result } = renderHook(() => usePanelState())
    const errors = [makeError('are', 'is')]
    act(() => result.current.setResults(errors, 'This are wrong'))
    expect(result.current.state).toEqual({ type: 'results', errors, fieldText: 'This are wrong' })
  })

  it('transitions to ai-rewriting', () => {
    const { result } = renderHook(() => usePanelState())
    act(() => result.current.setAIRewriting())
    expect(result.current.state.type).toBe('ai-rewriting')
  })

  it('transitions to ai-result', () => {
    const { result } = renderHook(() => usePanelState())
    act(() => result.current.setAIResult('Fixed text', false))
    expect(result.current.state).toEqual({ type: 'ai-result', rewritten: 'Fixed text', isSelection: false })
  })

  it('transitions to translating', () => {
    const { result } = renderHook(() => usePanelState())
    act(() => result.current.setTranslating())
    expect(result.current.state.type).toBe('translating')
  })

  it('transitions to translate-result', () => {
    const { result } = renderHook(() => usePanelState())
    act(() => result.current.setTranslateResult('Bonjour'))
    expect(result.current.state).toEqual({ type: 'translate-result', translated: 'Bonjour' })
  })

  it('transitions to error', () => {
    const { result } = renderHook(() => usePanelState())
    act(() => result.current.setError('Something went wrong'))
    expect(result.current.state).toEqual({ type: 'error', message: 'Something went wrong' })
  })

  it('resets to idle', () => {
    const { result } = renderHook(() => usePanelState())
    act(() => result.current.setChecking())
    act(() => result.current.reset())
    expect(result.current.state.type).toBe('idle')
  })

  it('dismiss after AI rewrite restores previous results', () => {
    const { result } = renderHook(() => usePanelState())
    const errors = [makeError('teh', 'the')]
    act(() => result.current.setResults(errors, 'teh cat'))
    act(() => result.current.setAIRewriting())
    act(() => result.current.setAIResult('The cat', false))
    act(() => result.current.dismiss())
    expect(result.current.state).toEqual({ type: 'results', errors, fieldText: 'teh cat' })
  })

  it('dismiss after translate restores previous results', () => {
    const { result } = renderHook(() => usePanelState())
    const errors = [makeError('teh', 'the')]
    act(() => result.current.setResults(errors, 'teh cat'))
    act(() => result.current.setTranslating())
    act(() => result.current.setTranslateResult('Le chat'))
    act(() => result.current.dismiss())
    expect(result.current.state).toEqual({ type: 'results', errors, fieldText: 'teh cat' })
  })

  it('dismiss with no previous results falls back to empty results', () => {
    const { result } = renderHook(() => usePanelState())
    act(() => result.current.setAIResult('text', false))
    act(() => result.current.dismiss())
    expect(result.current.state).toEqual({ type: 'results', errors: [], fieldText: '' })
  })
})
