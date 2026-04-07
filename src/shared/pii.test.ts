import { describe, it, expect } from 'vitest'
import { anonymizePii } from './pii'

describe('anonymizePii', () => {
  it('replaces email addresses', () => {
    expect(anonymizePii('Contact me at john@example.com please')).toBe(
      'Contact me at [EMAIL] please'
    )
  })

  it('replaces multiple emails in one string', () => {
    expect(anonymizePii('Email john@example.com or jane@corp.io')).toBe('Email [EMAIL] or [EMAIL]')
  })

  it('replaces North-American phone (dashes)', () => {
    expect(anonymizePii('Call 555-123-4567 tomorrow')).toBe('Call [PHONE] tomorrow')
  })

  it('replaces North-American phone (dots)', () => {
    expect(anonymizePii('Call 555.123.4567 tomorrow')).toBe('Call [PHONE] tomorrow')
  })

  it('replaces North-American phone with country code', () => {
    expect(anonymizePii('Call +1-555-123-4567')).toBe('Call [PHONE]')
  })

  it('replaces international phone', () => {
    expect(anonymizePii('Call +33 6 12 34 56 78 tomorrow')).toBe('Call [PHONE] tomorrow')
  })

  it('replaces both email and phone in one string', () => {
    expect(anonymizePii('Email john@example.com or call 555-123-4567')).toBe(
      'Email [EMAIL] or call [PHONE]'
    )
  })

  it('does not alter plain text with no PII', () => {
    expect(anonymizePii('The dog ate 3 apples in 2025')).toBe('The dog ate 3 apples in 2025')
  })

  it('returns empty string unchanged', () => {
    expect(anonymizePii('')).toBe('')
  })
})
