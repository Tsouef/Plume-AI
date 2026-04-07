import { useTranslation } from 'react-i18next'
import styles from './ManualModeSection.module.css'

interface ManualModeSectionProps {
  value: boolean
  onChange: (value: boolean) => void
}

export function ManualModeSection({ value, onChange }: ManualModeSectionProps) {
  const { t } = useTranslation()
  return (
    <div className="section">
      <span className="label">{t('popup.checkMode')}</span>
      <div className={styles.group} role="group">
        <button
          type="button"
          className={`${styles.btn}${!value ? ` ${styles.active}` : ''}`}
          onClick={() => onChange(false)}
        >
          {t('popup.checkModeAuto')}
        </button>
        <button
          type="button"
          className={`${styles.btn}${value ? ` ${styles.active}` : ''}`}
          onClick={() => onChange(true)}
        >
          {t('popup.checkModeManual')}
        </button>
      </div>
    </div>
  )
}
