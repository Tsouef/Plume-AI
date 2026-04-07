import { useState, useEffect } from 'react'
import { getConfig } from './storage'
import type { Config } from './types'

export function useStorageConfig(initialConfig: Config): Config {
  const [config, setConfig] = useState(initialConfig)

  useEffect(() => {
    function handleStorageChange() {
      getConfig()
        .then(setConfig)
        .catch(() => console.warn('[plume-ai] Failed to reload config on storage change'))
    }
    try {
      chrome.storage.onChanged.addListener(handleStorageChange)
    } catch {
      // Extension context invalidated — keep the initial config
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

  return config
}
