import { AnimatePresence } from 'motion/react'
import { usePanelOrchestration } from './hooks/usePanelOrchestration'
import { TriggerButton } from './components/TriggerButton/TriggerButton'
import { GrammarPanel } from './components/GrammarPanel/GrammarPanel'
import type { Config } from '../shared/types'
import { useStorageConfig } from '../shared/useStorageConfig'

interface ContentAppProps {
  config: Config
}

export function ContentApp({ config: initialConfig }: ContentAppProps) {
  const config = useStorageConfig(initialConfig)

  const {
    panelRef,
    activeField,
    isPanelOpen,
    panelField,
    state,
    openPanel,
    closePanel,
    handleRequestAI,
    handleApplyAI,
    handleRequestTranslate,
    dismiss,
  } = usePanelOrchestration(config)

  return (
    <>
      <AnimatePresence>
        {activeField && (
          <TriggerButton
            key="trigger"
            field={activeField}
            onClick={() => openPanel(activeField)}
          />
        )}
      </AnimatePresence>

      <GrammarPanel
        ref={panelRef}
        isOpen={isPanelOpen}
        state={state}
        field={panelField}
        onRequestAI={handleRequestAI}
        onApplyAI={handleApplyAI}
        onRequestTranslate={handleRequestTranslate}
        onClose={closePanel}
        onDismiss={dismiss}
      />
    </>
  )
}
