import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { CSSProperties, ButtonHTMLAttributes } from 'react'
import { render, screen } from '@testing-library/react'
import { TriggerButton } from './TriggerButton'

// Mock ResizeObserver if not available in jsdom
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock motion/react to avoid animation issues in jsdom
vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>()
  return {
    ...actual,
    motion: {
      button: (props: ButtonHTMLAttributes<HTMLButtonElement> & { style?: CSSProperties }) => {
        const { initial, animate, exit, whileHover, transition, ...rest } = props as Record<string, unknown>
        void initial; void animate; void exit; void whileHover; void transition
        return <button {...rest as ButtonHTMLAttributes<HTMLButtonElement>} />
      },
    },
  }
})

// TriggerButton uses createPortal(…, document.body) so the button renders into body
beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('TriggerButton component', () => {
  it('renders the trigger button into document.body via portal', () => {
    const field = document.createElement('div')
    document.body.appendChild(field)
    render(<TriggerButton field={field} onClick={vi.fn()} />)
    expect(screen.getByText('✦')).toBeTruthy()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    const field = document.createElement('div')
    document.body.appendChild(field)
    render(<TriggerButton field={field} onClick={onClick} />)
    screen.getByText('✦').click()
    expect(onClick).toHaveBeenCalledOnce()
  })
})
