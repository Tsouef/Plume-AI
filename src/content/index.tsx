import { createRoot } from 'react-dom/client'
import { getConfig } from '../shared/storage'
import { DEFAULT_CONFIG } from '../shared/config-defaults'
import { ContentApp } from './ContentApp'
import { ErrorBoundary } from './components/ErrorBoundary'

async function main() {
  const config = await getConfig().catch(() => DEFAULT_CONFIG)

  if (config.disabledDomains.includes(window.location.hostname)) return

  const host = document.createElement('div')
  host.id = 'grammar-assistant-root'
  document.body.appendChild(host)

  createRoot(host).render(
    <ErrorBoundary>
      <ContentApp config={config} />
    </ErrorBoundary>
  )
}

main()
