import { type CSSProperties, useState, forwardRef, useImperativeHandle, useEffect, useRef, useMemo, memo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { EASE_OUT, MAX_Z_INDEX } from '../../../shared/constants'
import { ShadowPortal, type ShadowPortalHandle } from '../ShadowPortal/ShadowPortal'
import { PanelHeader } from './PanelHeader/PanelHeader'
import { TonePillsBar } from './TonePillsBar/TonePillsBar'
import { TextPreview } from './TextPreview/TextPreview'
import { AIResultView } from './AIResultView/AIResultView'
import { TranslateBar } from './TranslateBar/TranslateBar'
import { buildSegments } from '../../utils/segments'
import type { GrammarError } from '../../../shared/types'
import type { PanelState } from '../../hooks/usePanelState'
import type { TonePreset } from '../../../shared/types'

export interface GrammarPanelHandle {
  isEventInside: (e: MouseEvent) => boolean
  getHost: () => HTMLElement | null
}

interface GrammarPanelProps {
  isOpen: boolean
  state: PanelState
  field: HTMLElement | null
  onRequestAI: (tone?: TonePreset) => void
  onApplyAI: (rewritten: string, isSelection: boolean) => void
  onRequestTranslate: (targetLang: string) => void
  onClose: () => void
  onDismiss: () => void
}

interface ErrorSectionProps {
  fieldText: string
  errors: GrammarError[]
  onApplyAI: (rewritten: string, isSelection: boolean) => void
  onClose: () => void
}

function ErrorSection({ fieldText, errors, onApplyAI, onClose }: ErrorSectionProps) {
  const segments = useMemo(() => buildSegments(fieldText, errors), [fieldText, errors])
  return (
    <>
      <TextPreview segments={segments} />
      <div className="actions">
        <button className="btn-primary" onClick={() => {
          const corrected = segments.map(s => s.error ? s.error.replacement : s.text).join('')
          onApplyAI(corrected, false)
          onClose()
        }}>
          Fix all
        </button>
      </div>
    </>
  )
}

export const GrammarPanel = memo(forwardRef<GrammarPanelHandle, GrammarPanelProps>(
  ({ isOpen, state, field, onRequestAI, onApplyAI, onRequestTranslate, onClose, onDismiss }, ref) => {
    const shadowRef = useRef<ShadowPortalHandle>(null)
    const [hostStyle, setHostStyle] = useState<CSSProperties>({
      position: 'fixed',
      zIndex: MAX_Z_INDEX,
      display: 'none',
    })

    useImperativeHandle(ref, () => ({
      isEventInside: (e: MouseEvent) => {
        const host = shadowRef.current?.host
        return host ? e.composedPath().includes(host) : false
      },
      getHost: () => shadowRef.current?.host ?? null,
    }))

    // Prevent mousedown from stealing focus from the active text field.
    // Must be on the host element (not inside React) to use composedPath()
    // across Shadow DOM boundaries.
    useEffect(() => {
      const host = shadowRef.current?.host
      if (!host) return

      function onMouseDown(e: MouseEvent) {
        const innerTarget = e.composedPath()[0] as HTMLElement
        if (innerTarget?.tagName !== 'SELECT') e.preventDefault()
      }
      host.addEventListener('mousedown', onMouseDown)
      return () => host.removeEventListener('mousedown', onMouseDown)
    }, []) // runs once after shadow is created

    // Reposition when field changes; show/hide when isOpen changes
    useEffect(() => {
      function reposition() {
        if (!field) {
          setHostStyle(prev => ({ ...prev, display: 'none' }))
          return
        }
        const rect = field.getBoundingClientRect()
        setHostStyle({
          position: 'fixed',
          zIndex: MAX_Z_INDEX,
          display: isOpen ? 'block' : 'none',
          top: 'auto',
          bottom: `${window.innerHeight - rect.top + 4}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
        })
      }

      reposition()
      if (!field) return
      const observer = new ResizeObserver(reposition)
      observer.observe(field)
      return () => observer.disconnect()
    }, [field, isOpen])

    return (
      <ShadowPortal ref={shadowRef} id="grammar-assistant-panel-host" style={hostStyle}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="panel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              <PanelHeader
                state={state}
                onRequestAI={onRequestAI}
              />

              {state.type === 'results' && (
                <TonePillsBar onSelectTone={onRequestAI} />
              )}

              {state.type === 'results' && state.errors.length > 0 && (
                <ErrorSection
                  fieldText={state.fieldText}
                  errors={state.errors}
                  onApplyAI={onApplyAI}
                  onClose={onClose}
                />
              )}

              {state.type === 'ai-result' && (
                <AIResultView
                  text={state.rewritten}
                  primaryLabel="Use this version"
                  secondaryLabel="Dismiss"
                  onPrimary={() => { onApplyAI(state.rewritten, state.isSelection); onClose() }}
                  onSecondary={onDismiss}
                />
              )}

              {state.type === 'translate-result' && (
                <AIResultView
                  text={state.translated}
                  primaryLabel="Accept"
                  secondaryLabel="Dismiss"
                  onPrimary={() => { onApplyAI(state.translated, false); onClose() }}
                  onSecondary={onDismiss}
                />
              )}

              {state.type === 'results' && (
                <TranslateBar onRequestTranslate={onRequestTranslate} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ShadowPortal>
    )
  }
))

GrammarPanel.displayName = 'GrammarPanel'
