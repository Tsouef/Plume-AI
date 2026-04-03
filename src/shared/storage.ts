import { mergeConfig, DEFAULT_CONFIG } from './config-defaults'
import { isExtensionValid } from './constants'
import type { Config } from './types'

export async function getConfig(): Promise<Config> {
  if (!isExtensionValid()) {
    return DEFAULT_CONFIG
  }
  const data = await chrome.storage.local.get(null)
  return mergeConfig(data as Partial<Config>)
}
