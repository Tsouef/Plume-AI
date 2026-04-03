function applyText(field: HTMLElement, newText: string): void {
  field.focus()
  const range = document.createRange()
  range.selectNodeContents(field)
  const sel = window.getSelection()
  if (sel) {
    sel.removeAllRanges()
    sel.addRange(range)
  }
  if (!document.execCommand('insertText', false, newText)) {
    // execCommand not supported — fall back to textContent (plain fields only)
    field.textContent = newText
    field.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }))
  }
}

export function applyAI(field: HTMLElement, rewritten: string, isSelection: boolean, savedRange?: Range): void {
  field.focus()
  if (isSelection && savedRange) {
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(savedRange)
    }
    if (!document.execCommand('insertText', false, rewritten)) {
      // execCommand not supported for selection — fall back to full text replacement
      applyText(field, rewritten)
    }
  } else {
    applyText(field, rewritten)
  }
}
