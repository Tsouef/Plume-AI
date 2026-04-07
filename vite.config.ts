import { defineConfig } from 'vite'
import webExtension from 'vite-plugin-web-extension'
import react from '@vitejs/plugin-react'

const browser = process.env.BROWSER || 'chrome'

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: './manifest.json',
      browser,
      additionalInputs: ['src/content/index.tsx'],
      transformManifest(manifest) {
        if (browser === 'firefox') {
          if (manifest.background && 'service_worker' in manifest.background) {
            const sw = manifest.background.service_worker
            delete manifest.background.service_worker
            manifest.background.scripts = [sw]
          }
        } else {
          delete manifest.browser_specific_settings
        }
        return manifest
      },
    }),
  ],
})
