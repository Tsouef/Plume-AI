import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as Toast from '@radix-ui/react-toast'
import { SavedMessage } from './SavedMessage'

function Wrapper({ visible }: { visible: boolean }) {
  return (
    <Toast.Provider>
      <SavedMessage visible={visible} />
      <Toast.Viewport />
    </Toast.Provider>
  )
}

describe('SavedMessage', () => {
  it('shows the saved message when visible=true', () => {
    render(<Wrapper visible={true} />)
    expect(screen.getByText(/saved/i)).toBeTruthy()
  })

  it('has role=status for screen reader announcement', () => {
    render(<Wrapper visible={true} />)
    expect(document.querySelector('[role="status"]')).toBeTruthy()
  })

  it('does not render when visible=false', () => {
    render(<Wrapper visible={false} />)
    expect(screen.queryByText(/saved/i)).toBeNull()
  })
})
