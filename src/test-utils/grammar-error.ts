import type { GrammarError } from '../shared/types'

export function makeError(original: string, replacement: string, context = original): GrammarError {
  return { original, replacement, message: 'test error', context }
}
