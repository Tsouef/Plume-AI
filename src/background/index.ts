import { getActiveProvider, createProvider } from './provider-factory'
import { fetchOllamaModels } from './providers/ollama'
import { getConfig } from '../shared/storage'
import type { BackgroundMessage, BackgroundResponse } from '../shared/types'

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'open-panel') return
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_PANEL' })
  } catch {
    // Content script not yet injected — inject it first, then retry
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/index.tsx'],
      })
      await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_PANEL' })
    } catch {
      // Tab not injectable (chrome:// pages, etc.) — silently ignore
    }
  }
})

chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, sender): Promise<BackgroundResponse> | undefined => {
    if (sender.id !== chrome.runtime.id) return
    return handleMessage(message).catch((err: Error) => ({ error: err.message }))
  }
)

export async function handleMessage(message: BackgroundMessage): Promise<BackgroundResponse> {
  if (message.type === 'GET_OLLAMA_MODELS') {
    try {
      const models = await fetchOllamaModels(message.baseUrl)
      return { models }
    } catch {
      return { models: [] }
    }
  }

  const config = await getConfig()
  const provider = getActiveProvider(config)

  if (message.type === 'CHECK_GRAMMAR') {
    const errors = await provider.checkGrammar(message.text, message.language, message.uiLanguage)
    return { errors }
  }
  if (message.type === 'AI_REWRITE') {
    const rewritten = await provider.rewrite(
      message.text,
      message.selection,
      message.language,
      message.tone
    )
    return { rewritten }
  }
  if (message.type === 'TRANSLATE') {
    const translated = await provider.translate(message.text, message.targetLanguage)
    return { translated }
  }
  if (message.type === 'TEST_CONNECTION') {
    const provider = createProvider(
      message.providerId,
      message.apiKey,
      message.model,
      message.baseUrl
    )
    try {
      const result = await Promise.race([
        provider.translate('Hello', 'en'),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timed out')), 10_000)),
      ])
      if (!result) return { ok: false, error: 'Empty response' }
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Connection failed' }
    }
  }
  throw new Error('Unknown message type')
}
