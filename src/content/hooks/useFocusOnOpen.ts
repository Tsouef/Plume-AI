import { useEffect, type RefObject } from 'react'

/**
 * When the panel opens, move focus to the first focusable element inside
 * the container. This enables keyboard users to immediately interact with
 * the panel after triggering it.
 *
 * Only activates when `isOpen` transitions from false → true, so it does
 * not steal focus on re-renders.
 */
export function useFocusOnOpen(containerRef: RefObject<HTMLElement | null>, isOpen: boolean) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    // Give Framer Motion one frame to complete the enter animation before
    // querying focusable elements (AnimatePresence + motion.div renders async).
    const raf = requestAnimationFrame(() => {
      const container = containerRef.current
      if (!container) return
      const focusable = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      focusable[0]?.focus()
    })

    return () => cancelAnimationFrame(raf)
  }, [isOpen, containerRef])
}
