import type { AIRewriteMessage, AIRewriteResponse, TonePreset } from '../../shared/types'
import { toErrorMessage } from '../../shared/constants'
import { sendBackgroundMessage } from './messaging'

export function requestAIRewrite(
  field: HTMLElement,
  language: string,
  onResult: (rewritten: string, isSelection: boolean, savedRange?: Range) => void,
  onError: (error: string) => void,
  tone?: TonePreset
): void {
  const text = field.textContent ?? ''
  if (!text.trim()) {
    onError('Nothing to rewrite')
    return
  }

  const selection = window.getSelection()
  let selectionText: string | undefined
  let savedRange: Range | undefined

  if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    if (field.contains(range.commonAncestorContainer)) {
      selectionText = selection.toString().trim() || undefined
      if (selectionText) savedRange = range.cloneRange()
    }
  }

  const isSelection = selectionText !== undefined

  const message: AIRewriteMessage = {
    type: 'AI_REWRITE',
    text,
    selection: selectionText,
    language,
    tone,
  }

  sendBackgroundMessage<AIRewriteResponse>(message)
    .then((response) => onResult(response.rewritten, isSelection, savedRange))
    .catch((err) => onError(toErrorMessage(err)))
}
