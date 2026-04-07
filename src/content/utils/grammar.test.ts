import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createGrammarChecker, isSmallDiff } from './grammar'
import { sendBackgroundMessage } from './messaging'

vi.mock('./messaging', () => ({
  sendBackgroundMessage: vi.fn(),
}))

const mockSend = vi.mocked(sendBackgroundMessage)

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('chrome', {
    runtime: { id: 'test-extension-id' },
  })
  mockSend.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('isSmallDiff', () => {
  it('returns true for identical strings', () => {
    expect(isSmallDiff('hello', 'hello')).toBe(true)
  })

  it('returns true when 1 char added', () => {
    expect(isSmallDiff('hello', 'helloo')).toBe(true)
  })

  it('returns true when 2 chars substituted', () => {
    expect(isSmallDiff('hello', 'henlo')).toBe(true)
  })

  it('returns false when 3 chars differ (substitutions)', () => {
    expect(isSmallDiff('the cat', 'the dog')).toBe(false)
  })

  it('returns false when length difference is 3 or more', () => {
    expect(isSmallDiff('hello', 'hello world')).toBe(false)
  })

  it('returns true when 1 char deleted', () => {
    expect(isSmallDiff('hello', 'helo')).toBe(true)
  })

  it('uses custom threshold', () => {
    expect(isSmallDiff('ab', 'ba', 2)).toBe(false) // 2 changes at threshold=2 → not small
    expect(isSmallDiff('ab', 'ba', 3)).toBe(true) // 2 changes at threshold=3 → small
  })
})

describe('createGrammarChecker', () => {
  it('does not call sendBackgroundMessage before 600ms', () => {
    const { check } = createGrammarChecker('en-US', 'en', vi.fn(), vi.fn(), 600)
    check('Hello world')
    vi.advanceTimersByTime(599)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('calls sendBackgroundMessage after 600ms debounce', async () => {
    mockSend.mockResolvedValue({ errors: [] })
    const { check } = createGrammarChecker('en-US', 'en', vi.fn(), vi.fn(), 600)
    check('Hello world')
    await vi.advanceTimersByTimeAsync(600)
    expect(mockSend).toHaveBeenCalledWith({
      type: 'CHECK_GRAMMAR',
      text: 'Hello world',
      language: 'en-US',
      uiLanguage: 'en',
    })
  })

  it('resets timer on rapid input — only sends once', async () => {
    mockSend.mockResolvedValue({ errors: [] })
    const { check } = createGrammarChecker('en-US', 'en', vi.fn(), vi.fn(), 600)
    check('H')
    vi.advanceTimersByTime(300)
    check('He')
    vi.advanceTimersByTime(300)
    check('Hello')
    vi.advanceTimersByTime(300)
    expect(mockSend).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(300)
    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ text: 'Hello' }))
  })

  it('calls onResults with parsed errors AND the original text', async () => {
    const onResults = vi.fn()
    const errors = [
      { original: 'are', replacement: 'is', message: 'SVA', context: 'data are wrong' },
    ]
    mockSend.mockResolvedValue({ errors })
    const { check } = createGrammarChecker('en-US', 'en', onResults, vi.fn(), 600)
    check('This are wrong')
    await vi.advanceTimersByTimeAsync(600)
    expect(onResults).toHaveBeenCalledWith(errors, 'This are wrong')
  })

  it('calls onResults with empty array for blank text without sending', () => {
    const onResults = vi.fn()
    const { check } = createGrammarChecker('en-US', 'en', onResults, vi.fn(), 600)
    check('   ')
    vi.advanceTimersByTime(600)
    expect(mockSend).not.toHaveBeenCalled()
    expect(onResults).toHaveBeenCalledWith([], '   ')
  })

  it('calls onError with "Request timed out" if sendBackgroundMessage rejects', async () => {
    const onError = vi.fn()
    mockSend.mockRejectedValue(new Error('Request timed out'))
    const { check } = createGrammarChecker('en-US', 'en', vi.fn(), onError, 600)
    check('Hello world')
    await vi.advanceTimersByTimeAsync(600)
    expect(onError).toHaveBeenCalledWith('Request timed out')
  })

  it('applies 5s backoff after RATE_LIMIT error', async () => {
    mockSend.mockRejectedValueOnce(new Error('RATE_LIMIT'))
    const onError = vi.fn()
    const { check } = createGrammarChecker('en-US', 'en', vi.fn(), onError, 600)
    check('text')
    await vi.advanceTimersByTimeAsync(600)
    expect(onError).toHaveBeenCalledWith('Rate limit — please wait a moment')

    mockSend.mockResolvedValue({ errors: [] })
    check('text again')
    vi.advanceTimersByTime(600)
    expect(mockSend).toHaveBeenCalledTimes(1) // still just the first call

    vi.advanceTimersByTime(4400 + 600)
    check('text after backoff')
    await vi.advanceTimersByTimeAsync(600)
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it('discards stale response when a newer request is in-flight', async () => {
    const onResults = vi.fn()
    let resolveFirst!: (value: { errors: never[] }) => void
    mockSend
      .mockImplementationOnce(
        () =>
          new Promise((res) => {
            resolveFirst = res as (v: { errors: never[] }) => void
          })
      )
      .mockResolvedValueOnce({ errors: [] })

    const { check } = createGrammarChecker('en-US', 'en', onResults, vi.fn(), 600)

    // Fire first request
    check('text one')
    await vi.advanceTimersByTimeAsync(600)
    expect(mockSend).toHaveBeenCalledTimes(1)

    // Fire second request while first is still pending
    // "text one plus" has length diff of 5 from "text one" — not a small diff
    check('text one plus')
    await vi.advanceTimersByTimeAsync(600)
    expect(mockSend).toHaveBeenCalledTimes(2)

    // Flush second (already resolved) response
    await Promise.resolve()
    await Promise.resolve()

    // Now resolve the first (stale) request
    resolveFirst({ errors: [] })
    for (let i = 0; i < 10; i++) {
      await Promise.resolve()
    }

    // onResults called exactly once: only for second request
    expect(onResults).toHaveBeenCalledTimes(1)
    expect(onResults).toHaveBeenCalledWith([], 'text one plus')
  })

  it('skips re-check when 1 char changed since last check', async () => {
    mockSend.mockResolvedValue({ errors: [] })
    const { check } = createGrammarChecker('en-US', 'en', vi.fn(), vi.fn(), 600)

    check('Hello world')
    await vi.advanceTimersByTimeAsync(600)
    await Promise.resolve()
    await Promise.resolve()
    expect(mockSend).toHaveBeenCalledTimes(1)

    // Add 1 char — diff = 1 < 3 → should skip
    check('Hello world!')
    await vi.advanceTimersByTimeAsync(600)
    expect(mockSend).toHaveBeenCalledTimes(1) // still 1
  })

  it('does not skip when 3 or more chars changed since last check', async () => {
    mockSend.mockResolvedValue({ errors: [] })
    const { check } = createGrammarChecker('en-US', 'en', vi.fn(), vi.fn(), 600)

    check('Hello world')
    await vi.advanceTimersByTimeAsync(600)
    await Promise.resolve()
    await Promise.resolve()
    expect(mockSend).toHaveBeenCalledTimes(1)

    // Add 3 chars — diff = 3 → should proceed
    check('Hello world abc')
    await vi.advanceTimersByTimeAsync(600)
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it('force=true bypasses isSmallDiff skip', async () => {
    const onSkip = vi.fn()
    mockSend.mockResolvedValue({ errors: [] })
    const { check } = createGrammarChecker('en-US', 'en', vi.fn(), vi.fn(), 600, undefined, onSkip)

    // First check sets lastCheckedText
    check('Hello world')
    await vi.advanceTimersByTimeAsync(600)
    await Promise.resolve()
    await Promise.resolve()
    expect(mockSend).toHaveBeenCalledTimes(1)

    // Small diff would normally skip — but force=true bypasses it
    check('Hello world!', true)
    await vi.advanceTimersByTimeAsync(600)
    await Promise.resolve()
    await Promise.resolve()
    expect(mockSend).toHaveBeenCalledTimes(2)
    expect(onSkip).not.toHaveBeenCalled()
  })

  it('does not skip on first check (no previous text)', async () => {
    mockSend.mockResolvedValue({ errors: [] })
    const { check } = createGrammarChecker('en-US', 'en', vi.fn(), vi.fn(), 600)

    check('Hi')
    await vi.advanceTimersByTimeAsync(600)
    expect(mockSend).toHaveBeenCalledTimes(1)
  })

  it('serves from cache immediately without API call on repeated text', async () => {
    const onResults = vi.fn()
    const errors = [{ original: 'x', replacement: 'y', message: 'm', context: 'c' }]
    mockSend.mockResolvedValue({ errors })
    const { check } = createGrammarChecker('en-US', 'en', onResults, vi.fn(), 600)

    // First check — goes to API
    check('cached text here')
    await vi.advanceTimersByTimeAsync(600)
    await Promise.resolve()
    await Promise.resolve()
    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(onResults).toHaveBeenCalledWith(errors, 'cached text here')

    mockSend.mockClear()
    onResults.mockClear()

    // Second check with same text — served from cache, no API call, no timer needed
    check('cached text here')
    expect(mockSend).not.toHaveBeenCalled()
    expect(onResults).toHaveBeenCalledTimes(1)
    expect(onResults).toHaveBeenCalledWith(errors, 'cached text here')
  })

  it('evicts oldest entry when cache exceeds 5 entries', async () => {
    const onResults = vi.fn()
    mockSend.mockResolvedValue({ errors: [] })
    const { check } = createGrammarChecker('en-US', 'en', onResults, vi.fn(), 600)

    // Fill cache with 5 distinct texts (each differs by >= 3 chars from previous)
    const texts = [
      'alpha text here',
      'beta text here!',
      'gamma text here',
      'delta text here',
      'epsil text here',
    ]
    for (const t of texts) {
      check(t)
      await vi.advanceTimersByTimeAsync(600)
      await Promise.resolve()
      await Promise.resolve()
    }
    expect(mockSend).toHaveBeenCalledTimes(5)
    mockSend.mockClear()
    onResults.mockClear()

    // Add 6th entry — evicts 'alpha text here' (oldest)
    check('zeta text here!!')
    await vi.advanceTimersByTimeAsync(600)
    await Promise.resolve()
    await Promise.resolve()
    expect(mockSend).toHaveBeenCalledTimes(1)
    mockSend.mockClear()
    onResults.mockClear()

    // 'alpha text here' was evicted — must hit API again
    check('alpha text here')
    await vi.advanceTimersByTimeAsync(600)
    await Promise.resolve()
    await Promise.resolve()
    expect(mockSend).toHaveBeenCalledTimes(1)
  })

  it('cache hit bypasses the debounce timer (synchronous result)', async () => {
    const onResults = vi.fn()
    const errors = [{ original: 'a', replacement: 'b', message: 'm', context: 'c' }]
    mockSend.mockResolvedValue({ errors })
    const { check } = createGrammarChecker('en-US', 'en', onResults, vi.fn(), 600)

    // Prime the cache
    check('my test text here')
    await vi.advanceTimersByTimeAsync(600)
    await Promise.resolve()
    await Promise.resolve()
    onResults.mockClear()

    // Cache hit — result returned synchronously, no timer advance needed
    check('my test text here')
    // No vi.advanceTimersByTimeAsync — cache hit must be immediate
    expect(onResults).toHaveBeenCalledTimes(1)
    expect(onResults).toHaveBeenCalledWith(errors, 'my test text here')
  })

  it('strips email addresses from text before sending to background', async () => {
    mockSend.mockResolvedValue({ errors: [] })
    const { check } = createGrammarChecker('en-US', 'en', vi.fn(), vi.fn(), 600)
    check('Email me at foo@bar.com please')
    await vi.advanceTimersByTimeAsync(600)
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Email me at [EMAIL] please' })
    )
  })
})
