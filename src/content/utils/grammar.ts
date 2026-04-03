import type { GrammarError, CheckGrammarMessage, CheckGrammarResponse } from '../../shared/types'
import { RATE_LIMIT_BACKOFF_MS, MAX_GRAMMAR_TEXT_LENGTH, toErrorMessage } from '../../shared/constants'
import { sendBackgroundMessage } from './messaging'

export function createGrammarChecker(
  language: string,
  onResults: (errors: GrammarError[], text: string) => void,
  onError: (error: string) => void,
  delay = 600
): { check: (text: string) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  let backoffUntil = 0

  function check(text: string): void {
    if (timer) clearTimeout(timer)

    timer = setTimeout(() => {
      if (text.trim().length === 0) {
        onResults([], text)
        return
      }

      if (text.length > MAX_GRAMMAR_TEXT_LENGTH) {
        onError(`Text too long — checking first ${MAX_GRAMMAR_TEXT_LENGTH} characters`)
        text = text.slice(0, MAX_GRAMMAR_TEXT_LENGTH)
      }

      if (Date.now() < backoffUntil) {
        onError('Rate limit — please wait a moment')
        return
      }

      const message: CheckGrammarMessage = { type: 'CHECK_GRAMMAR', text, language }

      sendBackgroundMessage<CheckGrammarResponse>(message)
        .then((response) => onResults(response.errors, text))
        .catch((err: unknown) => {
          const msg = toErrorMessage(err)
          if (msg === 'RATE_LIMIT') {
            backoffUntil = Date.now() + RATE_LIMIT_BACKOFF_MS
            onError('Rate limit — please wait a moment')
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
