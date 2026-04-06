import { describe, it, expect } from 'vitest'
import {
  buildGrammarPrompt,
  buildTranslatePrompt,
  buildToneRewritePrompt,
  parseGrammarErrors,
} from './prompts'
import type { TonePreset } from '../../shared/types'

describe('buildGrammarPrompt', () => {
  it('returns an object with system and user keys', () => {
    const result = buildGrammarPrompt('Hello world', 'auto', 'en')
    expect(result).toHaveProperty('system')
    expect(result).toHaveProperty('user')
  })

  it('user message contains the text to check', () => {
    const result = buildGrammarPrompt('She dont know', 'auto', 'en')
    expect(result.user).toContain('She dont know')
  })

  it('user message contains the language instruction for specific language', () => {
    const result = buildGrammarPrompt('Bonjour', 'French', 'en')
    expect(result.user).toContain('French')
  })

  it('user message contains auto-detect instruction when language is auto', () => {
    const result = buildGrammarPrompt('Hello', 'auto', 'en')
    expect(result.user.toLowerCase()).toContain('detect')
  })

  it('system message does not contain the text to check', () => {
    const result = buildGrammarPrompt('my unique text 12345', 'auto', 'en')
    expect(result.system).not.toContain('my unique text 12345')
  })

  it('system message contains JSON output instruction', () => {
    const result = buildGrammarPrompt('Hello', 'auto', 'en')
    expect(result.system.toLowerCase()).toContain('json')
  })

  it('system message contains the explanation language', () => {
    const result = buildGrammarPrompt('Hello', 'auto', 'fr')
    expect(result.system).toContain('French')
  })
})

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
    expect(result).toContain('Return only')
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
      expect(result).toContain('Return only')
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

describe('parseGrammarErrors', () => {
  const validError = {
    original: 'dont',
    replacement: "doesn't",
    message: 'Missing apostrophe',
    context: 'She dont know',
  }

  it('parses a valid raw JSON string', () => {
    const result = parseGrammarErrors(JSON.stringify([validError]))
    expect(result).toHaveLength(1)
    expect(result[0].original).toBe('dont')
  })

  it('parses a raw string with markdown code fence wrapping', () => {
    const wrapped = '```json\n' + JSON.stringify([validError]) + '\n```'
    const result = parseGrammarErrors(wrapped)
    expect(result).toHaveLength(1)
  })

  it('accepts a pre-parsed array directly', () => {
    const result = parseGrammarErrors([validError])
    expect(result).toHaveLength(1)
    expect(result[0].replacement).toBe("doesn't")
  })

  it('returns [] for a pre-parsed array with invalid schema', () => {
    const result = parseGrammarErrors([{ original: 'x' }]) // missing required fields
    expect(result).toEqual([])
  })

  it('returns [] for a malformed JSON string', () => {
    const result = parseGrammarErrors('not json at all')
    expect(result).toEqual([])
  })

  it('returns [] for a JSON string with wrong structure', () => {
    const result = parseGrammarErrors('{"error": "oops"}')
    expect(result).toEqual([])
  })

  it('filters out no-op corrections where original equals replacement', () => {
    const noOp = { ...validError, replacement: 'dont' }
    const result = parseGrammarErrors([validError, noOp])
    expect(result).toHaveLength(1)
  })

  it('filters out items without context', () => {
    const noContext = { original: 'x', replacement: 'y', message: 'msg' }
    const result = parseGrammarErrors([noContext])
    expect(result).toHaveLength(0)
  })
})
