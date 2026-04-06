import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProviderSection } from './ProviderSection'
import type { ProviderId } from '../../../shared/types'

const PROVIDER_IDS: ProviderId[] = ['gemini', 'claude', 'openai', 'mistral', 'ollama']

const defaultProviderStates = Object.fromEntries(
  PROVIDER_IDS.map((id) => [
    id,
    { apiKey: '', model: '', baseUrl: id === 'ollama' ? 'http://localhost:11434' : '' },
  ])
) as Record<ProviderId, { apiKey: string; model: string; baseUrl: string }>

function renderSection(overrides: Partial<Parameters<typeof ProviderSection>[0]> = {}) {
  const props = {
    activeProvider: 'gemini' as ProviderId,
    providerStates: defaultProviderStates,
    onProviderChange: vi.fn(),
    onStateChange: vi.fn(),
    errors: {},
    ollamaModels: [],
    ollamaModelsStatus: 'idle' as const,
    ...overrides,
  }
  render(<ProviderSection {...props} />)
  return props
}

describe('ProviderSection — provider dropdown', () => {
  it('renders a provider select', () => {
    renderSection()
    expect(screen.getByRole('combobox', { name: /provider/i })).toBeInTheDocument()
  })

  it('calls onProviderChange when user picks a different provider', () => {
    const onProviderChange = vi.fn()
    renderSection({ onProviderChange })
    fireEvent.change(screen.getByRole('combobox', { name: /provider/i }), {
      target: { value: 'claude' },
    })
    expect(onProviderChange).toHaveBeenCalledWith('claude')
  })
})

describe('ProviderSection — API key field', () => {
  it('shows API key input for non-Ollama providers', () => {
    renderSection({ activeProvider: 'gemini' })
    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument()
  })

  it('hides API key input for Ollama', () => {
    renderSection({ activeProvider: 'ollama' })
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument()
  })

  it('shows error message when errors.apiKey is true', () => {
    renderSection({ activeProvider: 'gemini', errors: { apiKey: true } })
    expect(screen.getByText(/api key required/i)).toBeInTheDocument()
  })
})

describe('ProviderSection — baseUrl field', () => {
  it('shows baseUrl input only for Ollama', () => {
    renderSection({ activeProvider: 'ollama' })
    expect(screen.getByLabelText(/base url/i)).toBeInTheDocument()
  })

  it('hides baseUrl input for cloud providers', () => {
    renderSection({ activeProvider: 'gemini' })
    expect(screen.queryByLabelText(/base url/i)).not.toBeInTheDocument()
  })
})

describe('ProviderSection — model dropdown', () => {
  it('renders a model select for cloud providers', () => {
    renderSection({ activeProvider: 'gemini' })
    expect(screen.getByRole('combobox', { name: /model/i })).toBeInTheDocument()
  })

  it('renders model options from PROVIDER_MODELS for cloud providers', () => {
    renderSection({ activeProvider: 'gemini' })
    expect(screen.getByRole('option', { name: 'gemini-2.5-flash-lite' })).toBeInTheDocument()
  })

  it('renders Ollama models from ollamaModels prop', () => {
    renderSection({
      activeProvider: 'ollama',
      ollamaModels: ['llama3.2:latest', 'phi3:latest'],
      ollamaModelsStatus: 'idle',
    })
    expect(screen.getByRole('option', { name: 'llama3.2:latest' })).toBeInTheDocument()
  })

  it('shows loading text when ollamaModelsStatus is loading', () => {
    renderSection({ activeProvider: 'ollama', ollamaModelsStatus: 'loading' })
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows error text when ollamaModelsStatus is error', () => {
    renderSection({ activeProvider: 'ollama', ollamaModelsStatus: 'error' })
    expect(screen.getByText(/unreachable/i)).toBeInTheDocument()
  })
})

describe('ProviderSection — test connection button', () => {
  it('shows Test button for Ollama (no API key required)', () => {
    renderSection({ activeProvider: 'ollama' })
    expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument()
  })

  it('shows Test button for cloud provider when API key is entered', () => {
    renderSection({
      activeProvider: 'gemini',
      providerStates: {
        ...defaultProviderStates,
        gemini: { apiKey: 'my-key', model: '', baseUrl: '' },
      },
    })
    expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument()
  })

  it('hides Test button for cloud provider when API key is empty', () => {
    renderSection({ activeProvider: 'gemini' })
    expect(screen.queryByRole('button', { name: /test/i })).not.toBeInTheDocument()
  })
})
