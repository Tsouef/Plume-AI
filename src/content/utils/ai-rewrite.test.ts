import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requestAIRewrite } from './ai-rewrite'
import { sendBackgroundMessage } from './messaging'

vi.mock('./messaging', () => ({
  sendBackgroundMessage: vi.fn(),
}))

const mockSend = vi.mocked(sendBackgroundMessage)

beforeEach(() => {
  vi.stubGlobal('chrome', { runtime: { id: 'test-ext' } })
  mockSend.mockReset()
})

function makeField(text: string): HTMLElement {
  const div = document.createElement('div')
  div.textContent = text
  return div
}

describe('requestAIRewrite', () => {
  it('calls onError with i18n string when field has no text', () => {
    const onError = vi.fn()
    requestAIRewrite(makeField(''), 'en', vi.fn(), onError)
    expect(onError).toHaveBeenCalledWith('Nothing to rewrite')
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('calls onError when field has only whitespace', () => {
    const onError = vi.fn()
    requestAIRewrite(makeField('   '), 'en', vi.fn(), onError)
    expect(onError).toHaveBeenCalledWith('Nothing to rewrite')
  })

  it('sends AI_REWRITE message with correct fields', async () => {
    mockSend.mockResolvedValue({ rewritten: 'Better text' })
    const onResult = vi.fn()
    requestAIRewrite(makeField('Some text'), 'en-US', onResult, vi.fn())
    await vi.waitFor(() =>
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'AI_REWRITE', text: 'Some text', language: 'en-US' })
      )
    )
  })

  it('calls onResult with rewritten text', async () => {
    mockSend.mockResolvedValue({ rewritten: 'Better text' })
    const onResult = vi.fn()
    requestAIRewrite(makeField('Some text'), 'en', onResult, vi.fn())
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledWith('Better text', false, undefined))
  })

  it('passes tone in message when provided', async () => {
    mockSend.mockResolvedValue({ rewritten: 'Formal text' })
    requestAIRewrite(makeField('Some text'), 'en', vi.fn(), vi.fn(), 'formal')
    await vi.waitFor(() =>
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ tone: 'formal' }))
    )
  })

  it('calls onError when sendBackgroundMessage rejects', async () => {
    mockSend.mockRejectedValue(new Error('RATE_LIMIT'))
    const onError = vi.fn()
    requestAIRewrite(makeField('Some text'), 'en', vi.fn(), onError)
    await vi.waitFor(() =>
      expect(onError).toHaveBeenCalledWith('Rate limit — please wait a moment')
    )
  })
})

describe('requestAIRewrite — length limit', () => {
  it('calls onError and does not send if text exceeds MAX_GRAMMAR_TEXT_LENGTH', async () => {
    const longText = 'a'.repeat(3001)
    const onError = vi.fn()
    requestAIRewrite(makeField(longText), 'en', vi.fn(), onError)
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringContaining('3000')))
    expect(mockSend).not.toHaveBeenCalled()
  })
})
