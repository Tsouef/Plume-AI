import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createGrammarChecker } from './grammar'

const mockSendMessage = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('chrome', {
    runtime: { id: 'test-extension-id', sendMessage: mockSendMessage, lastError: null },
  })
  mockSendMessage.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('createGrammarChecker', () => {
  it('does not call sendMessage before 600ms', () => {
    const { check } = createGrammarChecker('en-US', vi.fn(), vi.fn())
    check('Hello world')
    vi.advanceTimersByTime(599)
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('calls sendMessage after 600ms debounce', () => {
    mockSendMessage.mockImplementation((_msg: unknown, cb: (r: unknown) => void) => cb({ errors: [] }))
    const { check } = createGrammarChecker('en-US', vi.fn(), vi.fn())
    check('Hello world')
    vi.advanceTimersByTime(600)
    expect(mockSendMessage).toHaveBeenCalledWith(
      { type: 'CHECK_GRAMMAR', text: 'Hello world', language: 'en-US' },
      expect.any(Function)
    )
  })

  it('resets timer on rapid input — only sends once', () => {
    mockSendMessage.mockImplementation((_msg: unknown, cb: (r: unknown) => void) => cb({ errors: [] }))
    const { check } = createGrammarChecker('en-US', vi.fn(), vi.fn())
    check('H')
    vi.advanceTimersByTime(300)
    check('He')
    vi.advanceTimersByTime(300)
    check('Hello')
    vi.advanceTimersByTime(300)
    expect(mockSendMessage).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Hello' }),
      expect.any(Function)
    )
  })

  it('calls onResults with parsed errors AND the original text', async () => {
    const onResults = vi.fn()
    const errors = [
      { original: 'are', replacement: 'is', message: 'SVA', context: 'data are wrong' },
    ]
    mockSendMessage.mockImplementation((_msg: unknown, cb: (r: unknown) => void) => cb({ errors }))
    const { check } = createGrammarChecker('en-US', onResults, vi.fn())
    check('This are wrong')
    await vi.advanceTimersByTimeAsync(600)
    expect(onResults).toHaveBeenCalledWith(errors, 'This are wrong')
  })

  it('calls onResults with empty array for blank text without sending', () => {
    const onResults = vi.fn()
    const { check } = createGrammarChecker('en-US', onResults, vi.fn())
    check('   ')
    vi.advanceTimersByTime(600)
    expect(mockSendMessage).not.toHaveBeenCalled()
    expect(onResults).toHaveBeenCalledWith([], '   ')
  })

  it('calls onError with "Request timed out" if sendMessage never responds within 20s', async () => {
    const onError = vi.fn()
    // sendMessage never calls its callback — simulates a hanging request
    mockSendMessage.mockImplementation(() => { /* no-op */ })
    const { check } = createGrammarChecker('en-US', vi.fn(), onError)
    check('Hello world')
    await vi.advanceTimersByTimeAsync(600)  // debounce fires, sendMessage called
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(20000) // 20s timeout fires
    expect(onError).toHaveBeenCalledWith('Request timed out')
  })

  it('applies 5s backoff after RATE_LIMIT error', async () => {
    mockSendMessage.mockImplementation((_msg: unknown, cb: (r: unknown) => void) =>
      cb({ error: 'RATE_LIMIT' })
    )
    const { check } = createGrammarChecker('en-US', vi.fn(), vi.fn())
    check('text')
    await vi.advanceTimersByTimeAsync(600) // flush debounce + Promise rejection + backoffUntil set
    mockSendMessage.mockReset()

    mockSendMessage.mockImplementation((_msg: unknown, cb: (r: unknown) => void) => cb({ errors: [] }))
    check('text again')
    vi.advanceTimersByTime(600)
    expect(mockSendMessage).not.toHaveBeenCalled()

    vi.advanceTimersByTime(4400 + 600)
    check('text after backoff')
    vi.advanceTimersByTime(600)
    expect(mockSendMessage).toHaveBeenCalledTimes(1)
  })
})
