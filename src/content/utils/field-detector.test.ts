import { describe, it, expect } from 'vitest'
import { getSelectorForHostname } from './field-detector'

describe('getSelectorForHostname', () => {
  it('returns Slack selector for app.slack.com', () => {
    expect(getSelectorForHostname('app.slack.com'))
      .toBe('div.ql-editor[contenteditable]')
  })

  it('returns Gmail selector for mail.google.com', () => {
    expect(getSelectorForHostname('mail.google.com'))
      .toBe('div[role="textbox"][contenteditable]')
  })

  it('returns Atlassian selector for mycompany.atlassian.net', () => {
    expect(getSelectorForHostname('mycompany.atlassian.net'))
      .toBe('div.ak-editor-content-area')
  })

  it('returns Atlassian selector for any *.atlassian.net subdomain', () => {
    expect(getSelectorForHostname('acme.atlassian.net'))
      .toBe('div.ak-editor-content-area')
  })

  it('returns generic fallback for unknown domains', () => {
    expect(getSelectorForHostname('notion.so'))
      .toBe('div[contenteditable="true"], textarea')
  })

  it('returns generic fallback for localhost', () => {
    expect(getSelectorForHostname('localhost'))
      .toBe('div[contenteditable="true"], textarea')
  })
})
