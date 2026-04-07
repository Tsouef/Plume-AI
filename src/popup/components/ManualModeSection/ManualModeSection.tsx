import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { useTranslation } from 'react-i18next'
import styles from './ManualModeSection.module.css'

interface ManualModeSectionProps {
  value: boolean
  onChange: (value: boolean) => void
}

export function ManualModeSection({ value, onChange }: ManualModeSectionProps) {
  const { t } = useTranslation()
  const currentValue = value ? 'manual' : 'auto'

  return (
    <div className="section">
      <span className="label" id="check-mode-label">
        {t('popup.checkMode')}
      </span>
      <ToggleGroup.Root
        type="single"
        value={currentValue}
        onValueChange={(val) => {
          if (val) onChange(val === 'manual')
        }}
        className={styles.group}
        aria-labelledby="check-mode-label"
      >
        <ToggleGroup.Item value="auto" className={styles.btn}>
          {t('popup.checkModeAuto')}
        </ToggleGroup.Item>
        <ToggleGroup.Item value="manual" className={styles.btn}>
          {t('popup.checkModeManual')}
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  )
}
