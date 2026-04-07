import { useEffect, useRef } from 'react'

/**
 * Captures the currently focused element when the panel opens, and restores
 * focus to it when the panel closes. This lets keyboard users return to
 * their text field after dismissing the panel.
 */
export function useRestoreFocus(isOpen: boolean) {
  const savedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Capture the currently focused element (typically the text field)
      savedRef.current = document.activeElement as HTMLElement
    } else {
      // Restore focus when panel closes, if the saved element is still in the DOM
      if (savedRef.current && document.contains(savedRef.current)) {
        savedRef.current.focus()
      }
      savedRef.current = null
    }
  }, [isOpen])
}
