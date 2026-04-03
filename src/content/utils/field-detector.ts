interface SelectorRule {
  hostname: string   // exact match or suffix match
  selector: string
}

const SELECTOR_RULES: SelectorRule[] = [
  { hostname: 'app.slack.com',   selector: 'div.ql-editor[contenteditable]' },
  { hostname: 'mail.google.com', selector: 'div[role="textbox"][contenteditable]' },
  { hostname: 'atlassian.net',   selector: 'div.ak-editor-content-area' },
  { hostname: '*',               selector: 'div[contenteditable="true"], textarea' },
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

  constructor(onActivated: FieldListener, onDeactivated: DeactivationListener) {
    this.selector = getSelectorForHostname(window.location.hostname)
    this.onActivated = onActivated
    this.onDeactivated = onDeactivated
    this.observer = new MutationObserver(() => this.scan())
  }

  start(): void {
    this.observer.observe(document.body, { childList: true, subtree: true })
    document.addEventListener('focusin', this.handleFocusIn)
    document.addEventListener('focusout', this.handleFocusOut)
    this.scan()
  }

  stop(): void {
    this.observer.disconnect()
    document.removeEventListener('focusin', this.handleFocusIn)
    document.removeEventListener('focusout', this.handleFocusOut)
  }

  private scan(): void {
    const fields = document.querySelectorAll<HTMLElement>(this.selector)
    fields.forEach((field) => {
      if (document.activeElement === field && field !== this.activeField) {
        this.activate(field)
      }
    })
  }

  private handleFocusIn = (e: FocusEvent): void => {
    const target = e.target as HTMLElement
    if (target.matches(this.selector)) {
      this.activate(target)
    }
  }

  private handleFocusOut = (e: FocusEvent): void => {
    if (e.target === this.activeField) {
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
}
