import { describe, it, expect } from 'vitest'
import { buildTranslatePrompt, buildToneRewritePrompt } from './prompts'
import type { TonePreset } from '../../shared/types'

describe('buildTranslatePrompt', () => {
  it('includes the target language in the prompt', () => {
    const result = buildTranslatePrompt('Bonjour', 'en-US')
    expect(result).toContain('en-US')
  })

  it('includes the text to translate', () => {
    const result = buildTranslatePrompt('Bonjour le monde', 'en-US')
    expect(result).toContain('Bonjour le monde')
  })

  it('instructs to return only the translated text', () => {
    const result = buildTranslatePrompt('test', 'fr-FR')
    expect(result).toContain('Return only the translated text, nothing else')
  })
})

describe('buildToneRewritePrompt', () => {
  it('uses the full text when no selection is given', () => {
    const result = buildToneRewritePrompt('Hello world', 'shorter', 'auto')
    expect(result).toContain('Hello world')
  })

  it('uses the selection when provided', () => {
    const result = buildToneRewritePrompt('Hello world', 'formal', 'auto', 'Hello')
    expect(result).toContain('Hello')
    expect(result).not.toContain('world')
  })

  it('shorter tone instructs to be concise', () => {
    const result = buildToneRewritePrompt('test', 'shorter', 'auto')
    expect(result.toLowerCase()).toContain('concis')
  })

  it('formal tone instructs professional tone', () => {
    const result = buildToneRewritePrompt('test', 'formal', 'auto')
    expect(result.toLowerCase()).toContain('formal')
  })

  it('direct tone instructs to remove hedging', () => {
    const result = buildToneRewritePrompt('test', 'direct', 'auto')
    expect(result.toLowerCase()).toContain('direct')
  })

  it('technical tone instructs precise technical language', () => {
    const result = buildToneRewritePrompt('test', 'technical', 'auto')
    expect(result.toLowerCase()).toContain('technical')
  })

  it('instructs to return only the rewritten text', () => {
    const tones: TonePreset[] = ['shorter', 'formal', 'direct', 'technical']
    for (const tone of tones) {
      const result = buildToneRewritePrompt('test', tone, 'auto')
      expect(result).toContain('Return only the rewritten text, nothing else')
    }
  })

  it('includes explicit language instruction when language is set', () => {
    const result = buildToneRewritePrompt('test', 'formal', 'fr-FR')
    expect(result).toContain('fr-FR')
  })

  it('includes auto-detect instruction when language is auto', () => {
    const result = buildToneRewritePrompt('test', 'formal', 'auto')
    expect(result.toLowerCase()).toContain('same language')
  })
})
