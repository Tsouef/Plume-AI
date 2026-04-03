import type { Config } from '../../../shared/types'
import { LANGUAGE_OPTIONS } from '../../../shared/languages'

interface LanguageSectionProps {
  value: Config['language']
  onChange: (value: Config['language']) => void
}

export function LanguageSection({ value, onChange }: LanguageSectionProps) {
  return (
    <div className="section">
      <label className="label" htmlFor="language">Language</label>
      <select
        id="language"
        value={value}
        onChange={(e) => onChange(e.target.value as Config['language'])}
      >
        <option value="auto">Auto-detect</option>
        {LANGUAGE_OPTIONS.map(({ code, label }) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>
    </div>
  )
}
