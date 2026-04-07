import {
  type CSSProperties,
  type ReactNode,
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { createPortal } from 'react-dom'
import { panelStyles } from '../GrammarPanel/panel-styles'

export interface ShadowPortalHandle {
  host: HTMLElement | null
}

interface ShadowPortalProps {
  children: ReactNode
  style?: CSSProperties
  id?: string
  theme?: string
  onHostMount?: (host: HTMLElement) => void
}

export const ShadowPortal = forwardRef<ShadowPortalHandle, ShadowPortalProps>(
  ({ children, style, id, theme, onHostMount }, ref) => {
    const hostRef = useRef<HTMLDivElement>(null)
    const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null)

    useImperativeHandle(ref, () => ({
      get host() {
        return hostRef.current
      },
    }))

    useEffect(() => {
      const host = hostRef.current
      if (!host || host.shadowRoot) return

      const shadow = host.attachShadow({ mode: 'open' })

      const styleEl = document.createElement('style')
      styleEl.textContent = panelStyles
      shadow.appendChild(styleEl)

      const mount = document.createElement('div')
      shadow.appendChild(mount)
      setMountPoint(mount)
      onHostMount?.(host)
    }, [onHostMount])

    return (
      <>
        <div ref={hostRef} id={id} style={style} data-theme={theme} />
        {mountPoint && createPortal(children, mountPoint)}
      </>
    )
  }
)

ShadowPortal.displayName = 'ShadowPortal'
