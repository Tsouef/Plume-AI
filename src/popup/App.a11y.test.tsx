import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import * as Toast from '@radix-ui/react-toast'
import { ThemeSection } from './components/ThemeSection/ThemeSection'
import { ManualModeSection } from './components/ManualModeSection/ManualModeSection'
import { SavedMessage } from './components/SavedMessage/SavedMessage'
import { DomainTag } from './components/DomainTag/DomainTag'

describe('ThemeSection — a11y', () => {
  it('has no axe violations', async () => {
    const { container } = render(<ThemeSection value="dark" onChange={vi.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('arrow keys navigate between theme options', async () => {
    const user = userEvent.setup()
    render(<ThemeSection value="dark" onChange={vi.fn()} />)
    const darkOption = screen.getByRole('radio', { name: /dark/i })
    darkOption.focus()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: /light/i }))
  })
})

describe('ManualModeSection — a11y', () => {
  it('has no axe violations', async () => {
    const { container } = render(<ManualModeSection value={false} onChange={vi.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('SavedMessage — a11y', () => {
  it('has no axe violations when visible', async () => {
    const { container } = render(
      <Toast.Provider>
        <SavedMessage visible={true} />
        <Toast.Viewport />
      </Toast.Provider>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('DomainTag — a11y', () => {
  it('has no axe violations', async () => {
    const { container } = render(<DomainTag domain="example.com" onRemove={vi.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('remove button has accessible label', () => {
    render(<DomainTag domain="example.com" onRemove={vi.fn()} />)
    expect(screen.getByRole('button', { name: /remove example\.com/i })).toBeTruthy()
  })
})
