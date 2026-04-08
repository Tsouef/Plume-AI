import { mergeConfig, DEFAULT_CONFIG } from './config-defaults'
import { isExtensionValid } from './constants'
import type { Config } from './types'

export const STORAGE_KEY = 'config'

const FLAT_KEYS = ['activeProvider', 'providers', 'language'] as const

export async function getConfig(): Promise<Config> {
  if (!isExtensionValid()) {
    return DEFAULT_CONFIG
  }
  const result = await chrome.storage.local.get(STORAGE_KEY)
  if (result[STORAGE_KEY] !== undefined) {
    return mergeConfig(result[STORAGE_KEY] as Partial<Config>)
  }
  return migrateFromFlatKeys()
}

async function migrateFromFlatKeys(): Promise<Config> {
  const data = await chrome.storage.local.get(null)
  const flat: Partial<Config> = {}
  for (const key of FLAT_KEYS) {
    if (data[key] !== undefined) (flat as Record<string, unknown>)[key] = data[key]
  }
  const config = mergeConfig(flat)
  await chrome.storage.local.set({ [STORAGE_KEY]: config })
  const staleKeys = FLAT_KEYS.filter((k) => data[k] !== undefined)
  if (staleKeys.length > 0) await chrome.storage.local.remove([...staleKeys])
  return config
}
