import { useState } from 'react'
import { LANGUAGE_OPTIONS } from '../../../../shared/languages'

interface TranslateBarProps {
  onRequestTranslate: (lang: string) => void
}

export function TranslateBar({ onRequestTranslate }: TranslateBarProps) {
  const [targetLang, setTargetLang] = useState<string>(LANGUAGE_OPTIONS[0].code)

  return (
    <div className="translate-bar">
      <span className="translate-label">Translate to</span>
      <select
        className="translate-select"
        value={targetLang}
        onChange={(e) => setTargetLang(e.target.value)}
      >
        {LANGUAGE_OPTIONS.map(({ code, label }) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>
      <button className="btn-translate" onClick={() => onRequestTranslate(targetLang)}>
        Go
      </button>
    </div>
  )
}
