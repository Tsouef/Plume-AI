import { useState, useEffect } from 'react'
import { getConfig } from '../../shared/storage'
import { DEFAULT_CONFIG } from '../../shared/config-defaults'
import type { Config } from '../../shared/types'

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch(() => setConfig(DEFAULT_CONFIG))

    function handleStorageChange() {
      getConfig()
        .then(setConfig)
        .catch(() => console.warn('[plume-ai] Failed to reload config on storage change'))
    }
    try {
      chrome.storage.onChanged.addListener(handleStorageChange)
    } catch {
      // Extension context invalidated — keep the loaded config
      return
    }
    return () => {
      try {
        chrome.storage.onChanged.removeListener(handleStorageChange)
      } catch {
        // Extension context invalidated — nothing to clean up
      }
    }
  }, [])

  async function saveConfig(newConfig: Config): Promise<void> {
    await chrome.storage.local.set({ config: newConfig })
  }

  return { config, saveConfig }
}
