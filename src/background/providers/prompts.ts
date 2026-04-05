import { GrammarError, TonePreset, UiLocale } from '../../shared/types'

const EXPLANATION_LANG_NAMES: Record<UiLocale, string> = {
  'en':    'English',
  'en-GB': 'English',
  'fr':    'French',
  'de':    'German',
  'es':    'Spanish',
  'nl':    'Dutch',
}

function buildGrammarLangInstruction(language: string): string {
  return language === 'auto'
    ? 'Detect the language of the text automatically and check it in that language.'
    : `The text is written in ${language}. Check it as ${language} text.`
}

function buildRewriteLangInstruction(language: string): string {
  return language === 'auto'
    ? 'Detect the language of the following text and rewrite it in the same language.'
    : `Rewrite the following text in ${language}.`
}

export function buildGrammarPrompt(text: string, language: string, uiLanguage: UiLocale = 'en'): string {
  const langInstruction = buildGrammarLangInstruction(language)
  const explanationLang = EXPLANATION_LANG_NAMES[uiLanguage]
  return `You are a strict grammar and spelling checker. ${langInstruction}

Your job is to find real grammar, spelling, and word-choice errors in the text's own language — not style suggestions, and NEVER suggest replacing a word with its equivalent in another language.

Apply the rules of the detected language strictly. Look for:
- Spelling mistakes
- Wrong verb conjugation, tense, or mood
- Subject-verb agreement errors
- Gender or number agreement errors (where applicable: adjectives, articles, pronouns, participles)
- Wrong or missing articles (where applicable)
- Wrong prepositions
- Countability or mass noun errors: nouns used in the wrong number or with the wrong quantifier for the language
- Wrong word choice: a word exists in the language but is used with the wrong meaning — including false cognates caused by interference from another language (e.g. a word borrowed from another language but used with the meaning it has there, not in this language)
- Missing or extra words that break grammatical structure

Be strict and exhaustive: scan every word and phrase. Flag ALL errors, including basic spelling mistakes, non-standard words (e.g. "irregardless"), compound words written as one (e.g. "noone" → "no one"), and double comparatives (e.g. "more earlier"). Do not stop after finding a few — check the entire text word by word.

Do NOT:
- Suggest translating words into another language
- Flag words that are correct in the text's own language
- Make style or tone suggestions
- Flag correct but formal or informal word choices

Return a JSON array. Each error object must have:
- "original": the exact erroneous word or phrase as it appears in the text
- "replacement": the corrected version in the same language
- "message": a short explanation of the rule, written in ${explanationLang}
- "context": 4–8 words surrounding the error to uniquely locate it in the text

Return ONLY the JSON array, no explanation, no markdown. If there are truly no errors, return [].

Text:
${text}`
}

export function buildRewritePrompt(
  text: string,
  selection: string | undefined,
  language: string
): string {
  const target = selection ?? text
  return `${buildRewriteLangInstruction(language)} Fix all grammar, spelling, and style issues. Make it sound natural and professional. Return only the rewritten text, nothing else.\n\nText:\n${target}`
}

export function parseGrammarErrors(raw: string): GrammarError[] {
  const match = raw.match(/\[[\s\S]*\]/)
  let parsed: unknown
  try {
    parsed = JSON.parse(match ? match[0] : raw)
  } catch {
    throw new Error('Could not parse grammar response')
  }
  if (!Array.isArray(parsed)) throw new Error('Unexpected grammar response format')
  return parsed.filter(
    (e) =>
      typeof e.original === 'string' &&
      typeof e.replacement === 'string' &&
      typeof e.message === 'string' &&
      typeof e.context === 'string' &&
      e.original !== e.replacement // skip no-op corrections (AI knows something is wrong but can't fix it)
  )
}

export function buildTranslatePrompt(text: string, targetLanguage: string): string {
  return `Translate the following text to ${targetLanguage}. Return only the translated text, nothing else.\n\nText:\n${text}`
}

const TONE_INSTRUCTIONS: Record<TonePreset, string> = {
  shorter:      'Rewrite more concisely, keeping the same meaning.',
  formal:       'Rewrite in a more formal, professional tone.',
  direct:       'Rewrite more directly, remove any hedging or filler.',
  technical:    'Rewrite using precise technical language.',
  'grammar-fix': 'Fix every grammar, spelling, and word-choice error. Do not change the style, tone, structure, or meaning — only correct mistakes.',
}

export function buildToneRewritePrompt(
  text: string,
  tone: TonePreset,
  language: string,
  selection?: string
): string {
  const target = selection ?? text
  const langInstruction =
    language === 'auto'
      ? 'Detect the language of the text and rewrite it in the same language.'
      : `Rewrite in ${language}.`
  return `${TONE_INSTRUCTIONS[tone]} ${langInstruction} Return only the rewritten text, nothing else.\n\nText:\n${target}`
}
