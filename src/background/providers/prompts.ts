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

// Per-locale translations of the example explanations.
// Both examples use the same uiLanguage so the model learns:
// "explanation language is always uiLanguage, regardless of text language."
const EXAMPLE_MESSAGES: Record<UiLocale, [string, string]> = {
  en: [
    "The subject 'I' requires the base form of the verb. 'Has' is the third-person singular form; use 'have' instead.",
    "Use 'an' before words starting with a vowel sound. 'Apple' begins with the /æ/ vowel sound, so 'an' is required.",
  ],
  'en-GB': [
    "The subject 'I' requires the base form of the verb. 'Has' is the third-person singular form; use 'have' instead.",
    "Use 'an' before words starting with a vowel sound. 'Apple' begins with the /æ/ vowel sound, so 'an' is required.",
  ],
  fr: [
    "Le sujet 'I' exige la forme de base du verbe. 'Has' est réservé à la troisième personne du singulier ; il faut utiliser 'have'.",
    "On emploie 'an' devant les mots commençant par un son vocalique. 'Apple' commence par le son /æ/, donc 'an' est requis.",
  ],
  de: [
    "Das Subjekt 'I' erfordert die Grundform des Verbs. 'Has' ist die dritte Person Singular; verwende stattdessen 'have'.",
    "'An' steht vor Wörtern mit vokalischem Anlaut. 'Apple' beginnt mit dem Laut /æ/, daher ist 'an' erforderlich.",
  ],
  es: [
    "El sujeto 'I' requiere la forma base del verbo. 'Has' es la tercera persona del singular; usa 'have' en su lugar.",
    "Se usa 'an' ante palabras con sonido vocálico inicial. 'Apple' empieza con el sonido /æ/, por lo que se requiere 'an'.",
  ],
  nl: [
    "Het onderwerp 'I' vereist de basisvorm van het werkwoord. 'Has' is de derde persoon enkelvoud; gebruik in plaats daarvan 'have'.",
    "Gebruik 'an' voor woorden die beginnen met een klinkerklank. 'Apple' begint met de /æ/-klank, dus 'an' is vereist.",
  ],
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
  const [ex1, ex2] = EXAMPLE_MESSAGES[uiLanguage]

  const system = `You are an expert, strict grammar and spelling checker. Your mission is to find EVERY SINGLE error in the text.
Look for: spelling, conjugation, subject-verb agreement, gender/number agreement, articles, prepositions, word choice.

BE EXHAUSTIVE. Scan word by word. Do not skip any mistake.
Do NOT suggest style improvements or translations.

IMPORTANT: ALL "message" explanations MUST be written in ${explanationLang}, regardless of the language of the text being checked.

Respond with a JSON object containing an "errors" array:
{"errors": [{"original": "wrong phrase", "replacement": "corrected", "message": "1-2 sentence explanation in ${explanationLang} — state the rule and why this specific word/phrase violates it", "context": "4-8 words around it"}]}

Example:
Input: "I has a apple."
Output: {"errors": [{"original":"has","replacement":"have","message":"${ex1}","context":"I has a apple"},{"original":"a","replacement":"an","message":"${ex2}","context":"has a apple"}]}`

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
