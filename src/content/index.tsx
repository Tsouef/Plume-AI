import { createRoot } from 'react-dom/client'
import { getConfig } from '../shared/storage'
import { DEFAULT_CONFIG } from '../shared/config-defaults'
import '../shared/i18n/i18n'
import { ContentApp } from './ContentApp'
import { ErrorBoundary } from './components/ErrorBoundary'

async function main() {
  const config = await getConfig().catch(() => DEFAULT_CONFIG)

  if (document.getElementById('plume-ai-root')) return

  const host = document.createElement('div')
  host.id = 'plume-ai-root'
  host.style.cssText = 'all: initial; display: block; position: static;'
  document.body.appendChild(host)

  const root = createRoot(host)
  root.render(
    <ErrorBoundary>
      <ContentApp config={config} />
    </ErrorBoundary>
  )

  chrome.runtime.onMessage.addListener((message: { type?: string }) => {
    if (message.type === 'DEACTIVATE') {
      root.unmount()
      host.remove()
    }
  })
}

main()
