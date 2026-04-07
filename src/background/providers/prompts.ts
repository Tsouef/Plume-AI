import { z } from 'zod'
import { GrammarError, TonePreset, UiLocale } from '../../shared/types'

const EXPLANATION_LANG_NAMES: Record<UiLocale, string> = {
  en: 'English',
  'en-GB': 'English',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  nl: 'Dutch',
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

export function buildGrammarPrompt(
  text: string,
  language: string,
  uiLanguage: UiLocale = 'en'
): { system: string; user: string } {
  const explanationLang = EXPLANATION_LANG_NAMES[uiLanguage]

  const system = `You are an expert, strict grammar and spelling checker. Your mission is to find EVERY SINGLE error in the text.
Look for: spelling, conjugation, subject-verb agreement, gender/number agreement, articles, prepositions, word choice.

BE EXHAUSTIVE. Scan word by word. Do not skip any mistake.
Do NOT suggest style improvements or translations.

Respond with a JSON object containing an "errors" array:
{"errors": [{"original": "wrong phrase", "replacement": "corrected", "message": "1-2 sentence explanation in ${explanationLang} — state the rule and why this specific word/phrase violates it", "context": "4-8 words around it"}]}

Examples:
Input: "I has a apple."
Output: {"errors": [{"original":"has","replacement":"have","message":"The subject 'I' requires the base form of the verb. 'Has' is the third-person singular form; use 'have' instead.","context":"I has a apple"},{"original":"a","replacement":"an","message":"Use 'an' before words starting with a vowel sound. 'Apple' begins with the /æ/ vowel sound, so 'an' is required.","context":"has a apple"}]}

Input: "Je voudrai tenté de faire des fotes."
Output: {"errors": [{"original":"voudrai","replacement":"voudrais","message":"Le conditionnel présent de 'vouloir' requiert un 's' final à la première personne du singulier.","context":"Je voudrai tenté de"},{"original":"tenté","replacement":"tenter","message":"Après un verbe modal au conditionnel, le verbe suivant doit être à l'infinitif.","context":"voudrai tenté de faire"},{"original":"fotes","replacement":"fautes","message":"Orthographe incorrecte : le mot correct est 'fautes', nom féminin pluriel signifiant 'mistakes'.","context":"faire des fotes"}]}`

  const langInstruction = buildGrammarLangInstruction(language)
  const user = `${langInstruction}\n\nText:\n${text}`

  return { system, user }
}

export function buildRewritePrompt(
  text: string,
  selection: string | undefined,
  language: string
): string {
  const target = selection ?? text
  return `${buildRewriteLangInstruction(language)} Fix all grammar, spelling, and style issues. Make it sound natural and professional. Return only the rewritten text, nothing else.\n\nText:\n${target}`
}

const GrammarErrorSchema = z.object({
  original: z.string(),
  replacement: z.string(),
  message: z.string(),
  context: z.string().optional(),
})

const GrammarResponseSchema = z.array(GrammarErrorSchema)

export function parseGrammarErrors(raw: unknown): GrammarError[] {
  let parsed: unknown = raw

  if (typeof raw === 'string') {
    const match = raw.match(/\[[\s\S]*\]/) || raw.match(/\{[\s\S]*\}/)
    try {
      parsed = JSON.parse(match ? match[0] : raw)
    } catch {
      return []
    }
  }

  // Handle OpenAI "json_object" mode that might wrap errors in a field
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const possibleArray = Object.values(parsed).find(Array.isArray)
    if (possibleArray) parsed = possibleArray
  }

  const result = GrammarResponseSchema.safeParse(parsed)
  if (!result.success) return []

  return result.data
    .filter((e) => e.original !== e.replacement)
    .filter((e): e is typeof e & { context: string } => !!e.context)
}

export function buildTranslatePrompt(text: string, targetLanguage: string): string {
  return `Translate the following text to ${targetLanguage}. Return only the translated text, nothing else.\n\nText:\n${text}`
}

const TONE_INSTRUCTIONS: Record<TonePreset, string> = {
  shorter: 'Rewrite more concisely, keeping the same meaning.',
  formal: 'Rewrite in a more formal, professional tone.',
  direct: 'Rewrite more directly, remove any hedging or filler.',
  technical: 'Rewrite using precise technical language.',
  'grammar-fix':
    'Fix every grammar, spelling, and word-choice error. Do not change the style, tone, structure, or meaning — only correct mistakes.',
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
