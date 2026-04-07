import { type CSSProperties, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { EASE_OUT, MAX_Z_INDEX } from '../../../shared/constants'

const BUTTON_STYLE: CSSProperties = {
  position: 'fixed',
  zIndex: MAX_Z_INDEX - 1,
  background: 'linear-gradient(135deg,#00d4aa,#0ea5e9)',
  color: '#0a0b10',
  border: 'none',
  borderRadius: '50%',
  width: '30px',
  height: '30px',
  fontSize: '13px',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 12px rgba(0,212,170,0.35),0 0 0 2px rgba(0,212,170,0.1)',
  padding: 0,
  margin: 0,
  boxSizing: 'border-box',
  lineHeight: 1,
  outline: 'none',
}

interface TriggerButtonProps {
  field: HTMLElement
  onClick: () => void
}

export function TriggerButton({ field, onClick }: TriggerButtonProps) {
  const { t } = useTranslation()
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useLayoutEffect(() => {
    let raf = 0
    function reposition() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = field.getBoundingClientRect()
        setPosition({ top: rect.bottom - 34, left: rect.right - 34 })
      })
    }

    reposition()
    window.addEventListener('scroll', reposition, true)
    const observer = new ResizeObserver(reposition)
    observer.observe(field)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', reposition, true)
      observer.disconnect()
    }
  }, [field])

  return createPortal(
    <motion.button
      aria-label={t('panel.openPanel')}
      style={{ ...BUTTON_STYLE, top: position.top, left: position.left }}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      whileHover={{ scale: 1.18 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
    >
      ✦
    </motion.button>,
    document.body
  )
}
