import { useState, useEffect } from 'react'
import { getConfig } from '../../shared/storage'
import { DEFAULT_CONFIG } from '../../shared/config-defaults'
import type { Config } from '../../shared/types'

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    getConfig().then(setConfig).catch(() => setConfig(DEFAULT_CONFIG))

    function handleStorageChange() {
      getConfig()
        .then(setConfig)
        .catch(() => console.warn('[grammar-assistant] Failed to reload config on storage change'))
    }
    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  async function saveConfig(newConfig: Config): Promise<void> {
    await chrome.storage.local.set({ ...newConfig })
  }

  return { config, saveConfig }
}
