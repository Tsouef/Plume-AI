import { getActiveProvider } from './provider-factory'
import { getConfig } from '../shared/storage'
import type { BackgroundMessage, BackgroundResponse } from '../shared/types'

chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id) return
    handleMessage(message)
      .then(sendResponse)
      .catch((err: Error) => sendResponse({ error: err.message }))
    return true
  }
)

async function handleMessage(message: BackgroundMessage): Promise<BackgroundResponse> {
  const config = await getConfig()
  const provider = getActiveProvider(config)

  if (message.type === 'CHECK_GRAMMAR') {
    const errors = await provider.checkGrammar(message.text, message.language)
    return { errors }
  }
  if (message.type === 'AI_REWRITE') {
    const rewritten = await provider.rewrite(message.text, message.selection, message.language, message.tone)
    return { rewritten }
  }
  if (message.type === 'TRANSLATE') {
    const translated = await provider.translate(message.text, message.targetLanguage)
    return { translated }
  }
  throw new Error('Unknown message type')
}
