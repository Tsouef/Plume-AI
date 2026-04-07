import {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { EASE_OUT } from '../../../shared/constants'
import { ShadowPortal, type ShadowPortalHandle } from '../ShadowPortal/ShadowPortal'
import { PanelHeader } from './PanelHeader/PanelHeader'
import { TonePillsBar } from './TonePillsBar/TonePillsBar'
import { TextPreview } from './TextPreview/TextPreview'
import { AIResultView } from './AIResultView/AIResultView'
import { TranslateBar } from './TranslateBar/TranslateBar'
import { buildSegments } from '../../utils/segments'
import type { PanelState } from '../../hooks/usePanelState'
import type { TonePreset, ProviderId } from '../../../shared/types'
import { useFloatingPosition } from '../../hooks/useFloatingPosition'
import { useFocusOnOpen } from '../../hooks/useFocusOnOpen'
import { useRestoreFocus } from '../../hooks/useRestoreFocus'

export interface GrammarPanelHandle {
  isEventInside: (e: MouseEvent) => boolean
  getHost: () => HTMLElement | null
}

interface GrammarPanelProps {
  isOpen: boolean
  state: PanelState
  isRechecking?: boolean
  field: HTMLElement | null
  theme?: string
  activeProvider: ProviderId
  onRequestAI: (tone?: TonePreset) => void
  onApplyAI: (rewritten: string, isSelection: boolean) => void
  onRequestTranslate: (targetLang: string) => void
  onClose: () => void
  onDismiss: () => void
  onOpenSettings?: () => void
}

interface ErrorSectionProps {
  segments: ReturnType<typeof buildSegments>
  onRequestAI: (tone?: TonePreset) => void
}

function ErrorSection({ segments, onRequestAI }: ErrorSectionProps) {
  const { t } = useTranslation()
  return (
    <>
      <TextPreview segments={segments} />
      <div className="actions">
        <button className="btn-primary" onClick={() => onRequestAI('grammar-fix')}>
          {t('panel.fixAll')}
        </button>
      </div>
    </>
  )
}

export const GrammarPanel = memo(
  forwardRef<GrammarPanelHandle, GrammarPanelProps>(
    (
      {
        isOpen,
        state,
        isRechecking,
        field,
        theme,
        activeProvider,
        onRequestAI,
        onApplyAI,
        onRequestTranslate,
        onClose,
        onDismiss,
        onOpenSettings,
      },
      ref
    ) => {
      const { t } = useTranslation()
      const shadowRef = useRef<ShadowPortalHandle>(null)
      const panelRef = useRef<HTMLDivElement>(null)

      const segments = useMemo(
        () =>
          state.type === 'results' && state.errors.length > 0
            ? buildSegments(state.fieldText, state.errors)
            : null,
        [state]
      )
      const matchedErrorCount = segments ? segments.filter((s) => s.error).length : undefined

      useFocusOnOpen(panelRef, isOpen)
      useRestoreFocus(isOpen)

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
          const tag = innerTarget?.tagName
          const interactive = ['BUTTON', 'SELECT', 'INPUT', 'TEXTAREA', 'A']
          if (!interactive.includes(tag)) e.preventDefault()
        }
        host.addEventListener('mousedown', onMouseDown)
        return () => host.removeEventListener('mousedown', onMouseDown)
      }, []) // runs once after shadow is created

      const [panelHostEl, setPanelHostEl] = useState<HTMLElement | null>(null)
      const onHostMount = useCallback((host: HTMLElement) => {
        setPanelHostEl(host)
      }, [])

      const hostStyle = useFloatingPosition(field, panelHostEl, isOpen)

      return (
        <ShadowPortal
          ref={shadowRef}
          id="plume-ai-panel-host"
          style={hostStyle}
          theme={theme}
          onHostMount={onHostMount}
        >
          <Dialog.Root
            open={isOpen}
            onOpenChange={(open) => {
              if (!open) onClose()
            }}
            modal={false}
          >
            <AnimatePresence>
              {isOpen && (
                <Dialog.Content
                  asChild
                  onEscapeKeyDown={(e) => {
                    e.preventDefault()
                    onClose()
                  }}
                >
                  <motion.div
                    ref={panelRef}
                    className={`panel${isRechecking ? ' panel--rechecking' : ''}`}
                    aria-label={t('panel.panelLabel')}
                    aria-describedby="grammar-panel-status"
                    tabIndex={-1}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                  >
                    <PanelHeader
                      state={state}
                      matchedErrorCount={matchedErrorCount}
                      activeProvider={activeProvider}
                      isRechecking={isRechecking}
                      onRequestAI={onRequestAI}
                      onOpenSettings={onOpenSettings}
                    />

                    {state.type === 'results' && <TonePillsBar onSelectTone={onRequestAI} />}

                    {segments && segments.some((s) => s.error) && (
                      <ErrorSection segments={segments} onRequestAI={onRequestAI} />
                    )}

                    {state.type === 'ai-result' && (
                      <AIResultView
                        text={state.rewritten}
                        label={t('panel.aiSuggestion')}
                        primaryLabel={t('panel.useThisVersion')}
                        secondaryLabel={t('panel.dismiss')}
                        onPrimary={() => {
                          onApplyAI(state.rewritten, state.isSelection)
                          onClose()
                        }}
                        onSecondary={onDismiss}
                      />
                    )}

                    {state.type === 'translate-result' && (
                      <AIResultView
                        text={state.translated}
                        label={t('panel.translation')}
                        primaryLabel={t('panel.accept')}
                        secondaryLabel={t('panel.dismiss')}
                        onPrimary={() => {
                          onApplyAI(state.translated, false)
                          onClose()
                        }}
                        onSecondary={onDismiss}
                      />
                    )}

                    {state.type === 'results' && (
                      <TranslateBar onRequestTranslate={onRequestTranslate} />
                    )}
                  </motion.div>
                </Dialog.Content>
              )}
            </AnimatePresence>
          </Dialog.Root>
        </ShadowPortal>
      )
    }
  )
)

GrammarPanel.displayName = 'GrammarPanel'
