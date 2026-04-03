import { useState, useEffect } from 'react'
import { FieldDetector } from '../utils/field-detector'
import { useLatestRef } from './useLatestRef'

// isPanelElement receives e.relatedTarget from the focusout event.
// Chrome retargets relatedTarget to the shadow host when focus moves into shadow DOM,
// so comparing against the host element works for both SELECT and button clicks.
export function useFieldDetector(isPanelElement?: (el: Element | null) => boolean) {
  const [activeField, setActiveField] = useState<HTMLElement | null>(null)
  const isPanelElementRef = useLatestRef(isPanelElement)

  useEffect(() => {
    const detector = new FieldDetector(
      (field) => setActiveField(field),
      (_, nextFocus) => {
        if (isPanelElementRef.current?.(nextFocus)) return
        setActiveField(null)
      }
    )
    detector.start()
    return () => detector.stop()
  }, [isPanelElementRef]) // isPanelElementRef is a stable ref object — effect runs once

  return activeField
}
