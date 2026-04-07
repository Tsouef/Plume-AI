import { useEffect, useState, type CSSProperties } from 'react'
import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom'
import { MAX_Z_INDEX } from '../../shared/constants'

const HIDDEN: CSSProperties = { position: 'fixed', zIndex: MAX_Z_INDEX, display: 'none' }

export function useFloatingPosition(
  reference: HTMLElement | null,
  floating: HTMLElement | null,
  isOpen: boolean
): CSSProperties {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!reference || !floating || !isOpen) {
      return () => {
        setCoords(null)
      }
    }

    function update() {
      if (!reference || !floating) return
      void computePosition(reference, floating, {
        placement: 'top-start',
        strategy: 'fixed',
        middleware: [offset(4), flip(), shift({ padding: 8 })],
      }).then(({ x, y }) => setCoords({ x, y }))
    }

    const cleanup = autoUpdate(reference, floating, update)
    return () => {
      cleanup()
      setCoords(null)
    }
  }, [reference, floating, isOpen])

  if (!isOpen || !reference || coords === null) return HIDDEN

  return {
    position: 'fixed',
    zIndex: MAX_Z_INDEX,
    display: 'block',
    left: `${coords.x}px`,
    top: `${coords.y}px`,
    width: `${reference.getBoundingClientRect().width}px`,
  }
}
