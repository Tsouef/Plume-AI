import type {
  GrammarError,
  CheckGrammarMessage,
  CheckGrammarResponse,
  UiLocale,
} from '../../shared/types'
import {
  RATE_LIMIT_BACKOFF_MS,
  MAX_GRAMMAR_TEXT_LENGTH,
  GRAMMAR_DEBOUNCE_MS,
  GRAMMAR_MIN_DIFF_CHARS,
  GRAMMAR_CACHE_SIZE,
  toErrorMessage,
} from '../../shared/constants'
import { sendBackgroundMessage } from './messaging'
import { anonymizePii } from '../../shared/pii'
import i18n from '../../shared/i18n/i18n'

/**
 * Returns true if fewer than `threshold` characters were inserted, deleted,
 * or substituted between `a` and `b`. Uses an O(n) scan with re-sync on
 * length mismatches; early-exits at threshold.
 */
export function isSmallDiff(a: string, b: string, threshold = GRAMMAR_MIN_DIFF_CHARS): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) >= threshold) return false
  let changes = 0
  let ai = 0
  let bi = 0
  while (ai < a.length && bi < b.length) {
    if (a[ai] !== b[bi]) {
      changes++
      if (changes >= threshold) return false
      if (a.length > b.length) ai++
      else if (b.length > a.length) bi++
      else {
        ai++
        bi++
      }
    } else {
      ai++
      bi++
    }
  }
  changes += a.length - ai + (b.length - bi)
  return changes < threshold
}

export function createGrammarChecker(
  language: string,
  uiLanguage: UiLocale,
  onResults: (errors: GrammarError[], text: string) => void,
  onError: (error: string) => void,
  delay = GRAMMAR_DEBOUNCE_MS,
  onStart?: () => void,
  onSkip?: () => void
): { check: (text: string, force?: boolean) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  let backoffUntil = 0
  let requestId = 0
  let lastCheckedText: string | null = null

  const cache: Array<{ text: string; errors: GrammarError[] }> = []

  function cacheGet(t: string): GrammarError[] | null {
    const entry = cache.find((e) => e.text === t)
    return entry ? entry.errors : null
  }

  function cacheSet(t: string, errors: GrammarError[]): void {
    const idx = cache.findIndex((e) => e.text === t)
    if (idx !== -1) cache.splice(idx, 1)
    cache.unshift({ text: t, errors })
    if (cache.length > GRAMMAR_CACHE_SIZE) cache.pop()
  }

  function check(text: string, force = false): void {
    const cached = cacheGet(text)
    if (cached !== null) {
      lastCheckedText = text
      onResults(cached, text)
      return
    }

    if (timer) clearTimeout(timer)

    timer = setTimeout(() => {
      if (text.trim().length === 0) {
        onResults([], text)
        return
      }

      if (text.length > MAX_GRAMMAR_TEXT_LENGTH) {
        onError(i18n.t('error.textTooLong', { max: MAX_GRAMMAR_TEXT_LENGTH }))
        text = text.slice(0, MAX_GRAMMAR_TEXT_LENGTH)
      }

      if (Date.now() < backoffUntil) {
        onError(i18n.t('error.rateLimited'))
        return
      }

      if (!force && lastCheckedText !== null && isSmallDiff(lastCheckedText, text)) {
        onSkip?.()
        return
      }

      onStart?.()
      const thisRequestId = ++requestId
      const message: CheckGrammarMessage = {
        type: 'CHECK_GRAMMAR',
        text: anonymizePii(text),
        language,
        uiLanguage,
      }

      sendBackgroundMessage<CheckGrammarResponse>(message)
        .then((response) => {
          if (thisRequestId !== requestId) return
          lastCheckedText = text
          cacheSet(text, response.errors)
          onResults(response.errors, text)
        })
        .catch((err: unknown) => {
          if (thisRequestId !== requestId) return
          const msg = toErrorMessage(err)
          if (msg === 'RATE_LIMIT') {
            backoffUntil = Date.now() + RATE_LIMIT_BACKOFF_MS
            onError(i18n.t('error.rateLimited'))
          } else {
            onError(msg)
          }
        })
    }, delay)
  }

  function cancel(): void {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { check, cancel }
}
