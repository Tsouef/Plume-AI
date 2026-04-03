import { GrammarError } from '../../shared/types'

export type Segment = { text: string; error?: GrammarError }

export function buildSegments(rawText: string, errors: GrammarError[]): Segment[] {
  type Located = { start: number; end: number; error: GrammarError }
  const located: Located[] = []
  const contextSearchOffset = new Map<string, number>()

  for (const error of errors) {
    const searchFrom = contextSearchOffset.get(error.context) ?? 0
    const ctxIndex = rawText.indexOf(error.context, searchFrom)
    if (ctxIndex === -1) continue
    contextSearchOffset.set(error.context, ctxIndex + error.context.length)
    const localIndex = error.context.indexOf(error.original)
    if (localIndex === -1) continue
    const start = ctxIndex + localIndex
    const end = start + error.original.length
    located.push({ start, end, error })
  }

  located.sort((a, b) => a.start - b.start)

  // Remove overlapping entries — keep the first
  const clean: Located[] = []
  let cursor = 0
  for (const loc of located) {
    if (loc.start < cursor) continue
    clean.push(loc)
    cursor = loc.end
  }

  const segments: Segment[] = []
  cursor = 0
  for (const loc of clean) {
    if (cursor < loc.start) segments.push({ text: rawText.slice(cursor, loc.start) })
    segments.push({ text: rawText.slice(loc.start, loc.end), error: loc.error })
    cursor = loc.end
  }
  if (cursor < rawText.length) segments.push({ text: rawText.slice(cursor) })

  return segments
}
