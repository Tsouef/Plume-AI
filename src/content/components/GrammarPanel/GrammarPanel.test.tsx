import type React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GrammarPanel } from './GrammarPanel'
import type { TonePreset } from '../../../shared/types'
import type { PanelState } from '../../hooks/usePanelState'
import { makeError } from '../../../test-utils/grammar-error'

// ShadowPortal creates a shadow root which jsdom doesn't support — mock it to
// render children directly so we can assert on the rendered output.
vi.mock('../ShadowPortal/ShadowPortal', () => ({
  ShadowPortal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Avoid animation complications in jsdom
vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => {
        const { initial, animate, exit, transition, ...divRest } = rest as Record<string, unknown>
        void initial; void animate; void exit; void transition
        return <div className={className} {...divRest as React.HTMLAttributes<HTMLDivElement>}>{children}</div>
      },
    },
  }
})

interface MakeProps {
  state: PanelState
  isOpen?: boolean
  onRequestAI?: (tone?: TonePreset) => void
  onApplyAI?: (rewritten: string, isSelection: boolean) => void
  onRequestTranslate?: (targetLang: string) => void
  onClose?: () => void
  onDismiss?: () => void
  onOpenSettings?: () => void
}

function renderPanel({ state, isOpen = true, ...overrides }: MakeProps) {
  const props = {
    isOpen,
    state,
    field: null,
    onRequestAI: vi.fn(),
    onApplyAI: vi.fn(),
    onRequestTranslate: vi.fn(),
    onClose: vi.fn(),
    onDismiss: vi.fn(),
    ...overrides,
  }
  render(<GrammarPanel {...props} />)
  return props
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('GrammarPanel — error display', () => {
  it('shows "✅ Looks good" when errors is empty', () => {
    renderPanel({ state: { type: 'results', errors: [], fieldText: '' } })
    expect(screen.getByText(/✅ Looks good/)).toBeTruthy()
  })

  it('shows error count in header', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback'), makeError('informations', 'information')],
        fieldText: 'context with feedbacks and context with informations',
      },
    })
    expect(screen.getByText(/2 issues/)).toBeTruthy()
  })

  it('shows no nav arrows regardless of error count', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback'), makeError('informations', 'information')],
        fieldText: 'context with feedbacks and context with informations',
      },
    })
    expect(document.querySelector('.btn-nav')).toBeNull()
  })

  it('highlights all errors even when fieldText is longer than 300 chars', () => {
    const longPrefix = 'x'.repeat(350)
    const fieldText = longPrefix + ' context with lateError'
    renderPanel({ state: { type: 'results', errors: [makeError('lateError', 'fix')], fieldText } })
    const marks = document.querySelectorAll('mark.error-highlight')
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe('lateError')
  })

  it('highlights all errors in the text preview', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback'), makeError('informations', 'information')],
        fieldText: 'context with feedbacks and context with informations',
      },
    })
    const marks = document.querySelectorAll('mark.error-highlight')
    expect(marks).toHaveLength(2)
    expect(marks[0].textContent).toBe('feedbacks')
    expect(marks[1].textContent).toBe('informations')
  })

  it('error highlight shows inline annotation with replacement', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback')],
        fieldText: 'context with feedbacks',
      },
    })
    const group = document.querySelector('.error-group') as HTMLElement
    const mark = group.querySelector('mark.error-highlight')
    const annotation = group.querySelector('.error-annotation')
    expect(mark?.textContent).toBe('feedbacks')
    expect(annotation?.textContent).toBe(' → feedback')
  })

  it('shows text preview when there are errors', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback')],
        fieldText: 'context with feedbacks',
      },
    })
    expect(document.querySelector('.text-preview')).not.toBeNull()
  })

  it('does not show text preview when errors is empty', () => {
    renderPanel({ state: { type: 'results', errors: [], fieldText: '' } })
    expect(document.querySelector('.text-preview')).toBeNull()
  })

  it('shows Fix all button when there are errors', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback')],
        fieldText: 'context with feedbacks',
      },
    })
    expect(screen.getByText('Fix all')).toBeTruthy()
  })

  it('does not show Fix all button when errors is empty', () => {
    renderPanel({ state: { type: 'results', errors: [], fieldText: '' } })
    expect(document.querySelector('.btn-primary')).toBeNull()
  })

  it('Fix all triggers AI rewrite with grammar-fix tone', async () => {
    const props = renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback'), makeError('informations', 'information')],
        fieldText: 'context with feedbacks and context with informations',
      },
    })
    await userEvent.click(screen.getByText('Fix all'))
    expect(props.onRequestAI).toHaveBeenCalledWith('grammar-fix')
  })
})

describe('GrammarPanel — translation', () => {
  it('shows translation bar in results state', () => {
    renderPanel({ state: { type: 'results', errors: [], fieldText: '' } })
    expect(document.querySelector('.translate-bar')).not.toBeNull()
  })

  it('calls onRequestTranslate with the selected language when Go is clicked', async () => {
    const props = renderPanel({ state: { type: 'results', errors: [], fieldText: '' } })
    const select = document.querySelector('.translate-select') as HTMLSelectElement
    await userEvent.selectOptions(select, 'fr-FR')
    await userEvent.click(screen.getByText('Go'))
    expect(props.onRequestTranslate).toHaveBeenCalledWith('fr-FR')
  })

  it('does not show translation bar in checking state', () => {
    renderPanel({ state: { type: 'checking' } })
    expect(document.querySelector('.translate-bar')).toBeNull()
  })

  it('shows translating state and hides translation bar', () => {
    renderPanel({ state: { type: 'translating' } })
    expect(screen.getByText(/Translating/)).toBeTruthy()
    expect(document.querySelector('.translate-bar')).toBeNull()
  })

  it('shows translated text in translate-result state', () => {
    renderPanel({ state: { type: 'translate-result', translated: 'Hello world' } })
    expect(screen.getByText('Hello world')).toBeTruthy()
    expect(screen.getByText('Translation')).toBeTruthy()
  })

  it('"Accept" button calls onApplyAI with the translated text', async () => {
    const props = renderPanel({ state: { type: 'translate-result', translated: 'Hello world' } })
    await userEvent.click(screen.getByText('Accept'))
    expect(props.onApplyAI).toHaveBeenCalledWith('Hello world', false)
  })

  it('"Accept" calls onClose after applying translation', async () => {
    const props = renderPanel({ state: { type: 'translate-result', translated: 'Hello world' } })
    await userEvent.click(screen.getByText('Accept'))
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('"Use this version" calls onClose', async () => {
    const props = renderPanel({ state: { type: 'ai-result', rewritten: 'Fixed text', isSelection: false } })
    await userEvent.click(screen.getByText('Use this version'))
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('"Dismiss" button in translate-result calls onDismiss', async () => {
    const props = renderPanel({ state: { type: 'translate-result', translated: 'Hello world' } })
    await userEvent.click(screen.getByText('Dismiss'))
    expect(props.onDismiss).toHaveBeenCalledTimes(1)
  })

  it('"Dismiss" button in ai-result calls onDismiss', async () => {
    const props = renderPanel({ state: { type: 'ai-result', rewritten: 'Fixed text', isSelection: false } })
    await userEvent.click(screen.getByText('Dismiss'))
    expect(props.onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe('GrammarPanel — open settings CTA', () => {
  it('renders "Open settings" button when NO_PROVIDER_CONFIGURED error', () => {
    const onOpenSettings = vi.fn()
    renderPanel({
      isOpen: true,
      state: { type: 'error', message: 'NO_PROVIDER_CONFIGURED' },
      onOpenSettings,
    })
    const btn = screen.getByRole('button', { name: /open settings/i })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onOpenSettings).toHaveBeenCalledTimes(1)
  })

  it('does not render "Open settings" button for other error types', () => {
    renderPanel({
      isOpen: true,
      state: { type: 'error', message: 'Invalid API key' },
      onOpenSettings: vi.fn(),
    })
    expect(screen.queryByRole('button', { name: /open settings/i })).toBeNull()
  })
})

describe('GrammarPanel — scroll repositioning', () => {
  beforeEach(() => {
    // jsdom does not implement ResizeObserver — stub it out
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    })
  })

  it('calls reposition when window scroll event fires', async () => {
    const { waitFor } = await import('@testing-library/react')

    const field = document.createElement('div')
    field.setAttribute('contenteditable', 'true')
    document.body.appendChild(field)

    const getBoundingClientRect = vi.fn(() => ({
      top: 400, bottom: 450, left: 100, right: 400, width: 300, height: 50,
      x: 100, y: 400, toJSON: () => ({}),
    } as DOMRect))
    Object.defineProperty(field, 'getBoundingClientRect', { value: getBoundingClientRect })

    render(
      <GrammarPanel
        isOpen={true}
        state={{ type: 'idle' }}
        field={field}
        onRequestAI={vi.fn()}
        onApplyAI={vi.fn()}
        onRequestTranslate={vi.fn()}
        onClose={vi.fn()}
        onDismiss={vi.fn()}
      />
    )

    const initialCalls = getBoundingClientRect.mock.calls.length

    // Dispatch scroll event
    window.dispatchEvent(new Event('scroll'))

    await waitFor(() => {
      expect(getBoundingClientRect.mock.calls.length).toBeGreaterThan(initialCalls)
    })

    document.body.removeChild(field)
  })
})

describe('GrammarPanel — tone preset pills', () => {
  it('renders 4 tone pills in results state with errors', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('are', 'is')],
        fieldText: 'context with are',
      },
    })
    expect(document.querySelector('.btn-tone[data-tone="shorter"]')).not.toBeNull()
    expect(document.querySelector('.btn-tone[data-tone="formal"]')).not.toBeNull()
    expect(document.querySelector('.btn-tone[data-tone="direct"]')).not.toBeNull()
    expect(document.querySelector('.btn-tone[data-tone="technical"]')).not.toBeNull()
  })

  it('renders 4 tone pills in no-errors state', () => {
    renderPanel({ state: { type: 'results', errors: [], fieldText: '' } })
    expect(document.querySelector('.btn-tone[data-tone="shorter"]')).not.toBeNull()
    expect(document.querySelector('.btn-tone[data-tone="formal"]')).not.toBeNull()
    expect(document.querySelector('.btn-tone[data-tone="direct"]')).not.toBeNull()
    expect(document.querySelector('.btn-tone[data-tone="technical"]')).not.toBeNull()
  })

  it('clicking a tone pill calls onRequestAI with that tone', async () => {
    const props = renderPanel({ state: { type: 'results', errors: [], fieldText: '' } })
    const shorterBtn = document.querySelector<HTMLButtonElement>('.btn-tone[data-tone="shorter"]')!
    await userEvent.click(shorterBtn)
    expect(props.onRequestAI).toHaveBeenCalledWith('shorter')
  })

  it('clicking ✦ Improve calls onRequestAI with no tone', async () => {
    const props = renderPanel({ state: { type: 'results', errors: [], fieldText: '' } })
    const improveBtn = document.querySelector<HTMLButtonElement>('.btn-improve')!
    await userEvent.click(improveBtn)
    expect(props.onRequestAI).toHaveBeenCalledWith(undefined)
  })
})
