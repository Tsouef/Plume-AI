import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRestoreFocus } from './useRestoreFocus'

describe('useRestoreFocus', () => {
  it('restores focus to the element that was focused when panel opened', () => {
    const button = document.createElement('button')
    button.textContent = 'Field'
    document.body.appendChild(button)
    button.focus()
    expect(document.activeElement).toBe(button)

    const { rerender } = renderHook(({ isOpen }) => useRestoreFocus(isOpen), {
      initialProps: { isOpen: true },
    })

    // Focus moves away (simulating panel focus)
    const other = document.createElement('button')
    document.body.appendChild(other)
    other.focus()
    expect(document.activeElement).toBe(other)

    // Close panel
    act(() => {
      rerender({ isOpen: false })
    })

    expect(document.activeElement).toBe(button)
    document.body.removeChild(button)
    document.body.removeChild(other)
  })

  it('does not throw when no element was focused on open', () => {
    const { rerender } = renderHook(({ isOpen }) => useRestoreFocus(isOpen), {
      initialProps: { isOpen: false },
    })
    expect(() => {
      act(() => rerender({ isOpen: true }))
      act(() => rerender({ isOpen: false }))
    }).not.toThrow()
  })
})
