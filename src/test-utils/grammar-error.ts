import type { GrammarError } from '../shared/types'

export function makeError(
  original: string,
  replacement: string,
  context = original,
  message = 'test error'
): GrammarError {
  return { original, replacement, message, context }
}
