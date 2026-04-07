import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TonePillsBar } from './TonePillsBar'

describe('TonePillsBar', () => {
  it('renders all four tone buttons', () => {
    render(<TonePillsBar onSelectTone={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /shorter/i })).toBeTruthy()
    expect(screen.getByRole('radio', { name: /formal/i })).toBeTruthy()
    expect(screen.getByRole('radio', { name: /direct/i })).toBeTruthy()
    expect(screen.getByRole('radio', { name: /technical/i })).toBeTruthy()
  })

  it('marks the selected tone with aria-checked="true"', async () => {
    const user = userEvent.setup()
    render(<TonePillsBar onSelectTone={vi.fn()} />)
    const shorterBtn = screen.getByRole('radio', { name: /shorter/i })
    await user.click(shorterBtn)
    expect(shorterBtn).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onSelectTone with the tone value when clicked', async () => {
    const user = userEvent.setup()
    const onSelectTone = vi.fn()
    render(<TonePillsBar onSelectTone={onSelectTone} />)
    await user.click(screen.getByRole('radio', { name: /formal/i }))
    expect(onSelectTone).toHaveBeenCalledWith('formal')
  })
})
