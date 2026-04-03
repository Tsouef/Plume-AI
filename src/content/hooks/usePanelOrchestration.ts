import { useState, useRef, useEffect, useCallback } from 'react'
import { useFieldDetector } from './useFieldDetector'
import { useGrammarCheck } from './useGrammarCheck'
import { usePanelState } from './usePanelState'
import { useLatestRef } from './useLatestRef'
import { requestAIRewrite } from '../utils/ai-rewrite'
import { applyAI } from '../utils/text-apply'
import { sendBackgroundMessage } from '../utils/messaging'
import type { GrammarPanelHandle } from '../components/GrammarPanel/GrammarPanel'
import type { Config, TonePreset, TranslateMessage, TranslateResponse } from '../../shared/types'
import { toErrorMessage } from '../../shared/constants'

export function usePanelOrchestration(config: Config) {
  const panelRef = useRef<GrammarPanelHandle>(null)
  const panelInteractingRef = useRef(false)

  const activeField = useFieldDetector((relatedTarget) => {
    // A mousedown inside the panel just happened — suppress deactivation regardless
    // of where relatedTarget points (covers e.preventDefault() returning null target).
    if (panelInteractingRef.current) return true
    const host = panelRef.current?.getHost()
    return host != null && relatedTarget === host
  })

  const panelState = usePanelState()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [panelField, setPanelField] = useState<HTMLElement | null>(null)
  const panelFieldRef = useRef<HTMLElement | null>(null)
  const savedRangeRef = useRef<Range | undefined>(undefined)
  const translateRequestIdRef = useRef(0)
  const inputListenerRef = useRef<(() => void) | null>(null)

  const grammarCheck = useGrammarCheck({
    language: config.language,
    onResults: panelState.setResults,
    onError: panelState.setError,
  })

  const openPanel = useCallback((field: HTMLElement) => {
    panelFieldRef.current = field
    setPanelField(field)
    setIsPanelOpen(true)
    panelState.setChecking()
    grammarCheck(field.textContent ?? '')

    // Wire input listener for live re-checking
    if (inputListenerRef.current) {
      field.removeEventListener('input', inputListenerRef.current)
    }
    inputListenerRef.current = () => grammarCheck(field.textContent ?? '')
    field.addEventListener('input', inputListenerRef.current)
  }, [grammarCheck, panelState])

  const closePanel = useCallback(() => {
    setIsPanelOpen(false)
    setPanelField(null)
    panelState.reset()
    const field = panelFieldRef.current
    if (field && inputListenerRef.current) {
      field.removeEventListener('input', inputListenerRef.current)
      inputListenerRef.current = null
    }
    panelFieldRef.current = null
  }, [panelState])

  const closePanelRef = useLatestRef(closePanel)

  // Close panel when field loses focus (focus genuinely left both field and panel)
  useEffect(() => {
    if (!isPanelOpen) return
    if (activeField === null) closePanelRef.current()
  }, [activeField, isPanelOpen, closePanelRef])

  // Global mousedown: set interaction flag for panel clicks, close panel for outside clicks
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (panelRef.current?.isEventInside(e)) {
        // Set flag so focusout deactivation is suppressed during this interaction
        panelInteractingRef.current = true
        requestAnimationFrame(() => { panelInteractingRef.current = false })
        return
      }
      if (!isPanelOpen) return
      if (panelFieldRef.current && e.composedPath().includes(panelFieldRef.current)) return
      closePanelRef.current()
    }
    document.addEventListener('mousedown', handleMouseDown, true)
    return () => document.removeEventListener('mousedown', handleMouseDown, true)
  }, [isPanelOpen, closePanelRef])

  const handleRequestAI = useCallback((tone?: TonePreset) => {
    const field = panelFieldRef.current
    if (!field) return
    panelState.setAIRewriting()
    requestAIRewrite(
      field,
      config.language,
      (rewritten, isSelection, savedRange) => {
        savedRangeRef.current = savedRange
        panelState.setAIResult(rewritten, isSelection)
      },
      (err) => panelState.setError(err),
      tone,
    )
  }, [config.language, panelState])

  const handleApplyAI = useCallback((rewritten: string, isSelection: boolean) => {
    if (panelFieldRef.current) applyAI(panelFieldRef.current, rewritten, isSelection, savedRangeRef.current)
  }, [])

  const handleRequestTranslate = useCallback((targetLang: string) => {
    const field = panelFieldRef.current
    if (!field) return
    panelState.setTranslating()
    const myId = ++translateRequestIdRef.current
    const message: TranslateMessage = {
      type: 'TRANSLATE',
      text: field.textContent ?? '',
      targetLanguage: targetLang,
    }
    sendBackgroundMessage<TranslateResponse>(message)
      .then((response) => {
        if (myId !== translateRequestIdRef.current) return
        panelState.setTranslateResult(response.translated)
      })
      .catch((err) => {
        if (myId !== translateRequestIdRef.current) return
        panelState.setError(toErrorMessage(err))
      })
  }, [panelState])

  return {
    panelRef,
    activeField,
    isPanelOpen,
    panelField,
    state: panelState.state,
    openPanel,
    closePanel,
    handleRequestAI,
    handleApplyAI,
    handleRequestTranslate,
    dismiss: panelState.dismiss,
  }
}
