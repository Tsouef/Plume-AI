import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SavedMessage } from './SavedMessage'

describe('SavedMessage', () => {
  it('shows the saved message when visible=true', () => {
    render(<SavedMessage visible={true} />)
    expect(screen.getByText(/saved/i)).toBeTruthy()
  })

  it('has role=status for screen reader announcement', () => {
    render(<SavedMessage visible={true} />)
    expect(document.querySelector('[role="status"]')).toBeTruthy()
  })

  it('does not render when visible=false', () => {
    render(<SavedMessage visible={false} />)
    expect(screen.queryByText(/saved/i)).toBeNull()
  })
})
