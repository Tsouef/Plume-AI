import { useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { usePanelOrchestration } from './hooks/usePanelOrchestration'
import { TriggerButton } from './components/TriggerButton/TriggerButton'
import { GrammarPanel } from './components/GrammarPanel/GrammarPanel'
import type { Config } from '../shared/types'
import { useStorageConfig } from '../shared/useStorageConfig'
import i18n from '../shared/i18n/i18n'

interface ContentAppProps {
  config: Config
}

export function ContentApp({ config: initialConfig }: ContentAppProps) {
  const config = useStorageConfig(initialConfig)

  useEffect(() => {
    i18n.changeLanguage(config.uiLanguage)
  }, [config.uiLanguage])

  const {
    panelRef,
    activeField,
    isPanelOpen,
    panelField,
    state,
    isRechecking,
    openPanel,
    closePanel,
    handleRequestAI,
    handleApplyAI,
    handleRequestTranslate,
    dismiss,
  } = usePanelOrchestration(config)

  useEffect(() => {
    function handleCommand(message: { type?: string }) {
      if (message.type !== 'OPEN_PANEL') return
      if (isPanelOpen || !activeField) return
      openPanel(activeField)
    }
    try {
      chrome.runtime.onMessage.addListener(handleCommand)
    } catch {
      // Extension context invalidated
    }
    return () => {
      try {
        chrome.runtime.onMessage.removeListener(handleCommand)
      } catch {
        // Extension context invalidated
      }
    }
  }, [isPanelOpen, activeField, openPanel])

  if (config.disabledDomains.includes(window.location.hostname)) return null

  return (
    <>
      <AnimatePresence>
        {activeField && (
          <TriggerButton key="trigger" field={activeField} onClick={() => openPanel(activeField)} />
        )}
      </AnimatePresence>

      <GrammarPanel
        ref={panelRef}
        isOpen={isPanelOpen}
        state={state}
        isRechecking={isRechecking}
        field={panelField}
        theme={config.uiTheme ?? 'dark'}
        activeProvider={config.activeProvider}
        onRequestAI={handleRequestAI}
        onApplyAI={handleApplyAI}
        onRequestTranslate={handleRequestTranslate}
        onClose={closePanel}
        onDismiss={dismiss}
        onOpenSettings={() => chrome.runtime.openOptionsPage()}
      />
    </>
  )
}
