import type { BackgroundMessage, BackgroundResponse } from '../../shared/types'
import { REQUEST_TIMEOUT_MS, EXTENSION_ERROR_MSG, EXTENSION_INVALIDATED_MSG, isExtensionValid } from '../../shared/constants'

export function sendBackgroundMessage<T extends BackgroundResponse>(
  message: BackgroundMessage
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!isExtensionValid()) {
      reject(new Error(EXTENSION_INVALIDATED_MSG))
      return
    }

    const timeout = setTimeout(() => reject(new Error('Request timed out')), REQUEST_TIMEOUT_MS)

    try {
      chrome.runtime.sendMessage(message, (response: BackgroundResponse) => {
        clearTimeout(timeout)
        if (chrome.runtime.lastError) {
          reject(new Error(EXTENSION_ERROR_MSG))
          return
        }
        if (!response) {
          reject(new Error(EXTENSION_ERROR_MSG))
          return
        }
        if ('error' in response && response.error) {
          reject(new Error(response.error))
          return
        }
        resolve(response as T)
      })
    } catch {
      clearTimeout(timeout)
      reject(new Error(EXTENSION_INVALIDATED_MSG))
    }
  })
}
