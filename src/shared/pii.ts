const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const PHONE_RE = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}|\+\d{1,3}[-.\s]\d[\d\s.-]{7,}\d/g

export function anonymizePii(text: string): string {
  return text.replace(EMAIL_RE, '[EMAIL]').replace(PHONE_RE, '[PHONE]')
}
