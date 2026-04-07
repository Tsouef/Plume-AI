import type React from 'react'
import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { GrammarPanel } from './GrammarPanel'
import type { TonePreset } from '../../../shared/types'
import type { PanelState } from '../../hooks/usePanelState'
import { makeError } from '../../../test-utils/grammar-error'

// ShadowPortal creates a shadow root which jsdom doesn't support — mock it to
// render children directly so we can assert on the rendered output.
// The ref is forwarded with a host property so useFloatingPosition can work.
vi.mock('../ShadowPortal/ShadowPortal', () => ({
  ShadowPortal: forwardRef(function ShadowPortalMock(
    {
      children,
      onHostMount,
    }: { children: React.ReactNode; onHostMount?: (host: HTMLElement) => void },
    ref: React.Ref<{ host: HTMLElement | undefined; mountPoint: HTMLElement | undefined }>
  ) {
    const divRef = useRef<HTMLDivElement>(null)
    useImperativeHandle(ref, () => ({
      host: divRef.current ?? undefined,
      mountPoint: divRef.current ?? undefined,
    }))
    useEffect(() => {
      if (divRef.current) onHostMount?.(divRef.current)
    }, [onHostMount])
    return <div ref={divRef}>{children}</div>
  }),
}))

const { mockAutoUpdate, mockComputePosition } = vi.hoisted(() => {
  const mockAutoUpdate = vi.fn((_ref: unknown, _float: unknown, update: () => void) => {
    update()
    return vi.fn()
  })
  const mockComputePosition = vi.fn().mockResolvedValue({ x: 100, y: 200 })
  return { mockAutoUpdate, mockComputePosition }
})

vi.mock('@floating-ui/dom', () => ({
  computePosition: mockComputePosition,
  autoUpdate: mockAutoUpdate,
  flip: vi.fn(() => ({})),
  shift: vi.fn(() => ({})),
  offset: vi.fn(() => ({})),
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
        void initial
        void animate
        void exit
        void transition
        return (
          <div className={className} {...(divRest as React.HTMLAttributes<HTMLDivElement>)}>
            {children}
          </div>
        )
      },
    },
  }
})

import type { ProviderId } from '../../../shared/types'

interface MakeProps {
  state: PanelState
  isOpen?: boolean
  activeProvider?: ProviderId
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
    activeProvider: 'openai' as const,
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

  it('error item wraps word/arrow/fix in a header row', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback')],
        fieldText: 'context with feedbacks',
      },
    })
    const header = document.querySelector('.error-item-header')
    expect(header).not.toBeNull()
    expect(header?.querySelector('.error-item-word')?.textContent).toBe('feedbacks')
    expect(header?.querySelector('.error-item-fix')?.textContent).toBe('feedback')
  })

  it('error item renders explanation in a paragraph below the header', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [
          makeError(
            'feedbacks',
            'feedback',
            'context with feedbacks',
            'The plural form is incorrect here.'
          ),
        ],
        fieldText: 'context with feedbacks',
      },
    })
    const reason = document.querySelector('.error-item-reason')
    expect(reason?.tagName).toBe('P')
    expect(reason?.textContent).toBe('The plural form is incorrect here.')
  })

  it('error item does not render explanation paragraph when message is empty', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback', 'context with feedbacks', '')],
        fieldText: 'context with feedbacks',
      },
    })
    expect(document.querySelector('.error-item-reason')).toBeNull()
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
    const props = renderPanel({
      state: { type: 'ai-result', rewritten: 'Fixed text', isSelection: false },
    })
    await userEvent.click(screen.getByText('Use this version'))
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('"Dismiss" button in translate-result calls onDismiss', async () => {
    const props = renderPanel({ state: { type: 'translate-result', translated: 'Hello world' } })
    await userEvent.click(screen.getByText('Dismiss'))
    expect(props.onDismiss).toHaveBeenCalledTimes(1)
  })

  it('"Dismiss" button in ai-result calls onDismiss', async () => {
    const props = renderPanel({
      state: { type: 'ai-result', rewritten: 'Fixed text', isSelection: false },
    })
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

describe('GrammarPanel — collision-aware positioning', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    mockAutoUpdate.mockClear()
    mockComputePosition.mockClear()
  })

  it('starts autoUpdate when panel opens with a field', async () => {
    const { waitFor } = await import('@testing-library/react')

    const field = document.createElement('div')
    field.setAttribute('contenteditable', 'true')
    Object.defineProperty(field, 'getBoundingClientRect', {
      value: () => ({
        top: 400,
        bottom: 450,
        left: 100,
        right: 400,
        width: 300,
        height: 50,
        x: 100,
        y: 400,
        toJSON: () => ({}),
      }),
    })
    document.body.appendChild(field)

    render(
      <GrammarPanel
        isOpen={true}
        state={{ type: 'idle' }}
        field={field}
        activeProvider="openai"
        onRequestAI={vi.fn()}
        onApplyAI={vi.fn()}
        onRequestTranslate={vi.fn()}
        onClose={vi.fn()}
        onDismiss={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(mockAutoUpdate).toHaveBeenCalled()
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

  it('clicking ✦ Polish calls onRequestAI with no tone', async () => {
    const props = renderPanel({ state: { type: 'results', errors: [], fieldText: '' } })
    const polishBtn = document.querySelector<HTMLButtonElement>('.btn-polish')!
    await userEvent.click(polishBtn)
    expect(props.onRequestAI).toHaveBeenCalledWith(undefined)
  })
})

describe('GrammarPanel — mouse interaction', () => {
  it('clicking a button inside the panel does not call preventDefault', () => {
    renderPanel({ state: { type: 'results', errors: [], fieldText: '' } })
    const polishButton = screen.getByRole('button', { name: /polish/i })
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    polishButton.dispatchEvent(mousedown)
    expect(mousedown.defaultPrevented).toBe(false)
  })
})

describe('GrammarPanel — focus styles', () => {
  it('Fix All button is reachable by role', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback')],
        fieldText: 'context with feedbacks',
      },
    })
    const fixAll = screen.getByRole('button', { name: /fix all/i })
    expect(fixAll).toBeTruthy()
  })
})

describe('GrammarPanel — privacy badge', () => {
  it('shows local mode badge when activeProvider is ollama', () => {
    renderPanel({
      state: { type: 'idle' },
      activeProvider: 'ollama',
    })
    expect(screen.getByText(/local.*no data/i)).toBeInTheDocument()
  })

  it('does not show local mode badge for cloud providers', () => {
    renderPanel({ state: { type: 'idle' }, activeProvider: 'gemini' })
    expect(screen.queryByText(/local.*no data/i)).not.toBeInTheDocument()
  })
})

describe('GrammarPanel — keyboard', () => {
  it('calls onClose when Escape key is pressed inside the panel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderPanel({
      state: { type: 'results', errors: [], fieldText: '' },
      onClose,
    })
    const dialog = screen.getByRole('dialog')
    dialog.focus()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('GrammarPanel — screen reader', () => {
  it('has an aria-live="polite" region for status announcements', () => {
    renderPanel({ state: { type: 'checking' } })
    const liveRegion = document.querySelector('[aria-live="polite"]')
    expect(liveRegion).not.toBeNull()
  })

  it('status region announces the checking state', () => {
    renderPanel({ state: { type: 'checking' } })
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toMatch(/checking/i)
  })
})

describe('GrammarPanel — screen reader labels', () => {
  it('error annotation arrow has sr-only "replace with" text', () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback')],
        fieldText: 'context with feedbacks',
      },
    })
    // The visually hidden "replace with" text should be in the DOM
    expect(document.body.textContent).toMatch(/replace with/i)
  })
})

describe('GrammarPanel — axe accessibility', () => {
  it('has no axe violations in results state with errors', async () => {
    renderPanel({
      state: {
        type: 'results',
        errors: [makeError('feedbacks', 'feedback')],
        fieldText: 'context with feedbacks',
      },
    })
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations in results state with no errors', async () => {
    renderPanel({ state: { type: 'results', errors: [], fieldText: '' } })
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations in error state', async () => {
    renderPanel({ state: { type: 'error', message: 'Something went wrong' } })
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations in ai-result state', async () => {
    renderPanel({
      state: { type: 'ai-result', rewritten: 'Polished text here', isSelection: false },
    })
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations in translate-result state', async () => {
    renderPanel({
      state: { type: 'translate-result', translated: 'Texte traduit ici' },
    })
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()
  })
})
