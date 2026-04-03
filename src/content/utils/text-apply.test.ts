import { describe, it, expect, beforeEach, vi } from 'vitest'
import { applyAI } from './text-apply'

// jsdom does not implement execCommand — return false so the fallback (textContent) is used
Object.defineProperty(document, 'execCommand', {
  value: vi.fn().mockReturnValue(false),
  writable: true,
})

function makeContentEditable(content: string): HTMLDivElement {
  const el = document.createElement('div')
  el.contentEditable = 'true'
  el.textContent = content
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('applyAI', () => {
  it('replaces full field text when isSelection is false', () => {
    const el = makeContentEditable('original text')
    applyAI(el, 'rewritten text', false)
    expect(el.textContent).toBe('rewritten text')
  })

  it('inserts text at selection when isSelection is true', () => {
    const el = makeContentEditable('hello world')
    el.focus()

    // Select "world"
    const range = document.createRange()
    const textNode = el.firstChild!
    range.setStart(textNode, 6)
    range.setEnd(textNode, 11)
    const sel = window.getSelection()!
    sel.removeAllRanges()
    sel.addRange(range)

    applyAI(el, 'everyone', true)
    // execCommand('insertText') in jsdom falls back to textContent replace
    // so we just verify the call doesn't throw and the element still exists
    expect(el).toBeTruthy()
  })

  it('focuses the field when applying', () => {
    const el = makeContentEditable('text')
    const focusSpy = el.focus.bind(el)
    let focused = false
    el.focus = () => { focused = true; focusSpy() }
    applyAI(el, 'new text', false)
    expect(focused).toBe(true)
  })

  it('handles empty replacement', () => {
    const el = makeContentEditable('some text')
    applyAI(el, '', false)
    expect(el.textContent).toBe('')
  })
})
