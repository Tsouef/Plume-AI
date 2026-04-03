import { describe, it, expect } from 'vitest'
import { buildSegments } from './segments'
import { makeError } from '../../test-utils/grammar-error'

describe('buildSegments', () => {
  it('returns a single plain segment when there are no errors', () => {
    const segs = buildSegments('hello world', [])
    expect(segs).toEqual([{ text: 'hello world' }])
  })

  it('returns empty array for empty text and no errors', () => {
    expect(buildSegments('', [])).toEqual([])
  })

  it('marks a single error segment correctly', () => {
    const err = makeError('feedbacks', 'feedback')
    const segs = buildSegments('context with feedbacks here', [err])
    const marked = segs.filter((s) => s.error)
    expect(marked).toHaveLength(1)
    expect(marked[0].text).toBe('feedbacks')
    expect(marked[0].error).toBe(err)
  })

  it('marks multiple non-overlapping errors', () => {
    const err1 = makeError('feedbacks', 'feedback')
    const err2 = makeError('informations', 'information')
    const segs = buildSegments('context with feedbacks and context with informations', [err1, err2])
    const marked = segs.filter((s) => s.error)
    expect(marked).toHaveLength(2)
    expect(marked[0].text).toBe('feedbacks')
    expect(marked[1].text).toBe('informations')
  })

  it('skips errors whose context is not found in text', () => {
    const err = makeError('missing', 'fix')
    const segs = buildSegments('some other text', [err])
    expect(segs.filter((s) => s.error)).toHaveLength(0)
  })

  it('handles errors occurring late in a long text', () => {
    const longPrefix = 'x'.repeat(350)
    const fieldText = longPrefix + ' context with lateError'
    const err = makeError('lateError', 'fix')
    const segs = buildSegments(fieldText, [err])
    const marked = segs.filter((s) => s.error)
    expect(marked).toHaveLength(1)
    expect(marked[0].text).toBe('lateError')
  })

  it('places errors at distinct positions when the same context appears twice', () => {
    const text = 'She go to the shop. She go to the park.'
    const err1 = makeError('go', 'goes', 'She go to')
    const err2 = makeError('go', 'goes', 'She go to')
    const segs = buildSegments(text, [err1, err2])
    const marked = segs.filter((s) => s.error)
    expect(marked).toHaveLength(2)
    expect(marked[0].text).toBe('go')
    expect(marked[1].text).toBe('go')
  })

  it('plain text segments surround errors correctly', () => {
    const err = makeError('feedbacks', 'feedback')
    const segs = buildSegments('context with feedbacks here', [err])
    expect(segs[0].text).toBe('context with ')
    expect(segs[segs.length - 1].text).toBe(' here')
  })
})
