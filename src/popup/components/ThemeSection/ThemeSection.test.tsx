import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeSection } from './ThemeSection'

describe('ThemeSection', () => {
  it('shows the current theme as selected', () => {
    render(<ThemeSection value="dark" onChange={vi.fn()} />)
    const darkBtn = screen.getByRole('radio', { name: /dark/i })
    // Radix ToggleGroup type="single" renders as radiogroup/radio
    expect(darkBtn).toHaveAttribute('data-state', 'on')
  })

  it('calls onChange when a theme is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ThemeSection value="dark" onChange={onChange} />)
    await user.click(screen.getByRole('radio', { name: /light/i }))
    expect(onChange).toHaveBeenCalledWith('light')
  })

  it('has an accessible group label', () => {
    render(<ThemeSection value="dark" onChange={vi.fn()} />)
    // Radix ToggleGroup type="single" renders Root as role="group" with aria-labelledby
    expect(screen.getByRole('group', { name: /appearance/i })).toBeTruthy()
  })
})
