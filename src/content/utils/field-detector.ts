interface SelectorRule {
  hostname: string // exact match or suffix match
  selector: string
}

const SELECTOR_RULES: SelectorRule[] = [
  { hostname: 'app.slack.com', selector: 'div.ql-editor[contenteditable]' },
  { hostname: 'mail.google.com', selector: 'div[role="textbox"][contenteditable]' },
  { hostname: 'atlassian.net', selector: 'div.ak-editor-content-area' },
  { hostname: '*', selector: 'div[contenteditable="true"], textarea' },
]

export function getSelectorForHostname(hostname: string): string {
  const rule = SELECTOR_RULES.find(
    (r) => r.hostname === '*' || hostname === r.hostname || hostname.endsWith('.' + r.hostname)
  )
  return rule?.selector ?? 'div[contenteditable="true"], textarea'
}

type FieldListener = (field: HTMLElement) => void
type DeactivationListener = (field: HTMLElement, nextFocus: Element | null) => void

export class FieldDetector {
  private observer: MutationObserver
  private activeField: HTMLElement | null = null
  private readonly selector: string
  private readonly onActivated: FieldListener
  private readonly onDeactivated: DeactivationListener
  private readonly iframeCleanups = new Map<HTMLIFrameElement, () => void>()

  constructor(onActivated: FieldListener, onDeactivated: DeactivationListener) {
    this.selector = getSelectorForHostname(window.location.hostname)
    this.onActivated = onActivated
    this.onDeactivated = onDeactivated
    this.observer = new MutationObserver((mutations) => {
      this.scan()
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLIFrameElement) {
            this.attachToIframe(node)
          } else if (node instanceof Element) {
            node.querySelectorAll<HTMLIFrameElement>('iframe').forEach((iframe) => {
              this.attachToIframe(iframe)
            })
          }
        }
      }
    })
  }

  start(): void {
    this.observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('focusin', this.handleFocusIn)
    document.addEventListener('focusout', this.handleFocusOut)
    document.querySelectorAll<HTMLIFrameElement>('iframe').forEach((iframe) => {
      this.attachToIframe(iframe)
    })
    this.scan()
  }

  stop(): void {
    this.observer.disconnect()
    document.removeEventListener('focusin', this.handleFocusIn)
    document.removeEventListener('focusout', this.handleFocusOut)
    this.iframeCleanups.forEach((cleanup) => cleanup())
    this.iframeCleanups.clear()
  }

  private deepActiveElement(): Element | null {
    let el: Element | null = document.activeElement
    while (el && (el as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot?.activeElement) {
      el = (el as HTMLElement & { shadowRoot: ShadowRoot }).shadowRoot.activeElement
    }
    return el
  }

  private scan(): void {
    const active = this.deepActiveElement()
    if (
      active &&
      active instanceof HTMLElement &&
      active.matches(this.selector) &&
      active !== this.activeField
    ) {
      this.activate(active)
    }
  }

  private handleFocusIn = (e: FocusEvent): void => {
    const path = e.composedPath()
    const target = (path.length > 0 ? path[0] : e.target) as HTMLElement | null
    if (target?.matches?.(this.selector)) {
      this.activate(target)
    }
  }

  private handleFocusOut = (e: FocusEvent): void => {
    const path = e.composedPath()
    const target = (path.length > 0 ? path[0] : e.target) as HTMLElement | null
    if (target === this.activeField) {
      this.onDeactivated(this.activeField!, e.relatedTarget as Element | null)
      this.activeField = null
    }
  }

  private activate(field: HTMLElement): void {
    if (this.activeField && this.activeField !== field) {
      this.onDeactivated(this.activeField, null)
    }
    this.activeField = field
    this.onActivated(field)
  }

  private attachToIframe(iframe: HTMLIFrameElement): void {
    if (this.iframeCleanups.has(iframe)) return

    const tryAttach = () => {
      let iframeDoc: Document | null = null
      try {
        iframeDoc = iframe.contentDocument
      } catch {
        return // cross-origin: skip
      }
      if (!iframeDoc) return

      iframeDoc.addEventListener('focusin', this.handleFocusIn)
      iframeDoc.addEventListener('focusout', this.handleFocusOut)
      this.iframeCleanups.set(iframe, () => {
        try {
          iframeDoc!.removeEventListener('focusin', this.handleFocusIn)
          iframeDoc!.removeEventListener('focusout', this.handleFocusOut)
        } catch {
          // iframe may have been removed
        }
      })
    }

    if (iframe.contentDocument?.readyState === 'complete') {
      tryAttach()
    } else {
      iframe.addEventListener('load', tryAttach, { once: true })
    }
  }
}
