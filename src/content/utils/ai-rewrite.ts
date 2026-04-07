import type { AIRewriteMessage, AIRewriteResponse, TonePreset } from '../../shared/types'
import { toErrorMessage, MAX_GRAMMAR_TEXT_LENGTH } from '../../shared/constants'
import { sendBackgroundMessage } from './messaging'
import { anonymizePii } from '../../shared/pii'
import i18n from '../../shared/i18n/i18n'

export function requestAIRewrite(
  field: HTMLElement,
  language: string,
  onResult: (rewritten: string, isSelection: boolean, savedRange?: Range) => void,
  onError: (error: string) => void,
  tone?: TonePreset
): void {
  const text = field.textContent ?? ''
  if (!text.trim()) {
    onError(i18n.t('error.nothingToRewrite'))
    return
  }
  if (text.length > MAX_GRAMMAR_TEXT_LENGTH) {
    onError(i18n.t('error.textTooLong', { max: MAX_GRAMMAR_TEXT_LENGTH }))
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
    text: anonymizePii(text),
    selection: selectionText ? anonymizePii(selectionText) : undefined,
    language,
    tone,
  }

  sendBackgroundMessage<AIRewriteResponse>(message)
    .then((response) => onResult(response.rewritten, isSelection, savedRange))
    .catch((err) => {
      const msg = toErrorMessage(err)
      onError(msg === 'RATE_LIMIT' ? i18n.t('error.rateLimited') : msg)
    })
}
