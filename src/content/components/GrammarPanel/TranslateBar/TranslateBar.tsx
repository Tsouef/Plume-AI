import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_OPTIONS } from '../../../../shared/languages'

interface TranslateBarProps {
  onRequestTranslate: (lang: string) => void
}

export function TranslateBar({ onRequestTranslate }: TranslateBarProps) {
  const { t } = useTranslation()
  const [targetLang, setTargetLang] = useState<string>(LANGUAGE_OPTIONS[0].code)

  return (
    <div className="translate-bar">
      <label className="translate-label" htmlFor="plume-ai-translate-lang">
        {t('panel.translateTo')}
      </label>
      <select
        id="plume-ai-translate-lang"
        className="translate-select"
        value={targetLang}
        onChange={(e) => setTargetLang(e.target.value)}
      >
        {LANGUAGE_OPTIONS.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
      <button className="btn-translate" onClick={() => onRequestTranslate(targetLang)}>
        {t('panel.go')}
      </button>
    </div>
  )
}
