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
        const { initial, animate, exit, whileHover, transition, ...rest } = props as Record<
          string,
          unknown
        >
        void initial
        void animate
        void exit
        void whileHover
        void transition
        return <button {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} />
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
  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    const field = document.createElement('div')
    document.body.appendChild(field)
    render(<TriggerButton field={field} onClick={onClick} />)
    screen.getByText('✦').click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('button has defensive inline styles that override host-page resets', () => {
    const field = document.createElement('div')
    document.body.appendChild(field)
    render(<TriggerButton field={field} onClick={vi.fn()} />)
    const btn = screen.getByRole('button')
    const style = btn.getAttribute('style') ?? ''
    expect(style).toContain('padding: 0px')
    expect(style).toContain('margin: 0px')
    expect(style).toContain('box-sizing: border-box')
    expect(style).toContain('line-height: 1')
  })
})
