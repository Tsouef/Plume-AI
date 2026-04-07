import { useRef, useEffect, useCallback } from 'react'
import { createGrammarChecker } from '../utils/grammar'
import { useLatestRef } from './useLatestRef'
import { GrammarError, UiLocale } from '../../shared/types'
import { GRAMMAR_DEBOUNCE_MS } from '../../shared/constants'

interface UseGrammarCheckOptions {
  language: string
  uiLanguage: UiLocale
  onResults: (errors: GrammarError[], text: string) => void
  onError: (message: string) => void
  onStart?: () => void
  onSkip?: () => void
  delay?: number
}

export function useGrammarCheck({
  language,
  uiLanguage,
  onResults,
  onError,
  onStart,
  onSkip,
  delay = GRAMMAR_DEBOUNCE_MS,
}: UseGrammarCheckOptions) {
  const onResultsRef = useLatestRef(onResults)
  const onErrorRef = useLatestRef(onError)
  const onStartRef = useLatestRef(onStart)
  const onSkipRef = useLatestRef(onSkip)
  // checkerRef holds the current debounced checker instance.
  // It is updated in an effect (outside render) so ref reads in its closure are safe.
  const checkerRef = useRef<ReturnType<typeof createGrammarChecker> | undefined>(undefined)

  useEffect(() => {
    checkerRef.current?.cancel()
    checkerRef.current = createGrammarChecker(
      language,
      uiLanguage,
      (errors, text) => onResultsRef.current(errors, text),
      (msg) => onErrorRef.current(msg),
      delay,
      () => onStartRef.current?.(),
      () => onSkipRef.current?.()
    )
    return () => checkerRef.current?.cancel()
  }, [language, uiLanguage, delay, onResultsRef, onErrorRef, onStartRef, onSkipRef])

  // Return a stable callback that delegates to the latest checker instance.
  return useCallback((text: string) => {
    checkerRef.current?.check(text)
  }, [])
}
