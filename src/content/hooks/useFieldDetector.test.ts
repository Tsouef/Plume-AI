import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFieldDetector } from './useFieldDetector'

beforeEach(() => {
  vi.stubGlobal(
    'MutationObserver',
    class {
      observe() {}
      disconnect() {}
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

function makeContentEditable(): HTMLElement {
  const div = document.createElement('div')
  div.setAttribute('contenteditable', 'true')
  document.body.appendChild(div)
  return div
}

describe('useFieldDetector', () => {
  it('returns null initially', () => {
    const { result } = renderHook(() => useFieldDetector())
    expect(result.current).toBeNull()
  })

  it('returns the focused contenteditable field on focusin', () => {
    const field = makeContentEditable()
    const { result } = renderHook(() => useFieldDetector())

    act(() => {
      field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })

    expect(result.current).toBe(field)
  })

  it('returns null after focusout to an unrelated element', () => {
    const field = makeContentEditable()
    const { result } = renderHook(() => useFieldDetector())

    act(() => {
      field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })
    expect(result.current).toBe(field)

    act(() => {
      field.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    })
    expect(result.current).toBeNull()
  })

  it('keeps field active on focusout when isPanelElement returns true', () => {
    const field = makeContentEditable()
    const panelHost = document.createElement('div')
    document.body.appendChild(panelHost)

    const { result } = renderHook(() => useFieldDetector((el) => el === panelHost))

    act(() => {
      field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })
    act(() => {
      field.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: panelHost }))
    })

    expect(result.current).toBe(field)
  })

  it('switches to new field when another contenteditable gets focus', () => {
    const field1 = makeContentEditable()
    const field2 = makeContentEditable()
    const { result } = renderHook(() => useFieldDetector())

    act(() => {
      field1.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })
    expect(result.current).toBe(field1)

    act(() => {
      field2.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })
    expect(result.current).toBe(field2)
  })
})

describe('useFieldDetector — iframes', () => {
  it('detects focus in a same-origin iframe', () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument!
    const innerField = iframeDoc.createElement('div')
    innerField.setAttribute('contenteditable', 'true')
    iframeDoc.body.appendChild(innerField)

    // Trigger the iframe load event so FieldDetector attaches listeners
    iframe.dispatchEvent(new Event('load'))

    const { result } = renderHook(() => useFieldDetector())

    act(() => {
      innerField.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })

    expect(result.current).toBe(innerField)
  })

  it('detects focus in an iframe that loads after the detector starts', () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument!
    const innerField = iframeDoc.createElement('div')
    innerField.setAttribute('contenteditable', 'true')
    iframeDoc.body.appendChild(innerField)

    // Simulate iframe not yet loaded when detector starts
    Object.defineProperty(iframeDoc, 'readyState', { value: 'loading', configurable: true })

    const { result } = renderHook(() => useFieldDetector())

    // Now simulate the iframe finishing loading
    Object.defineProperty(iframeDoc, 'readyState', { value: 'complete', configurable: true })
    iframe.dispatchEvent(new Event('load'))

    act(() => {
      innerField.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    })

    expect(result.current).toBe(innerField)
  })
})

describe('useFieldDetector — shadow DOM', () => {
  it('detects a contenteditable field inside a shadow root', () => {
    const shadowHost = document.createElement('div')
    document.body.appendChild(shadowHost)
    const shadow = shadowHost.attachShadow({ mode: 'open' })
    const innerField = document.createElement('div')
    innerField.setAttribute('contenteditable', 'true')
    shadow.appendChild(innerField)

    const { result } = renderHook(() => useFieldDetector())

    act(() => {
      const event = new FocusEvent('focusin', {
        bubbles: true,
        composed: true,
      })
      Object.defineProperty(event, 'composedPath', {
        value: () => [
          innerField,
          shadow,
          shadowHost,
          document.body,
          document.documentElement,
          document,
          window,
        ],
      })
      document.dispatchEvent(event)
    })

    expect(result.current).toBe(innerField)
  })
})
