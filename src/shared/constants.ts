export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const MAX_Z_INDEX = 2147483647
export const SAVED_VISIBLE_DURATION_MS = 2000
export const EXTENSION_ERROR_MSG = 'Extension error'
export const EXTENSION_INVALIDATED_MSG = 'Extension updated — please refresh the page'
export const REQUEST_TIMEOUT_MS = 20000
export const RATE_LIMIT_BACKOFF_MS = 5000
export const MAX_GRAMMAR_TEXT_LENGTH = 3000

export function isExtensionValid(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id
}

export function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : EXTENSION_ERROR_MSG
}
