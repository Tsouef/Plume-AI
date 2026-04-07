import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { useTranslation } from 'react-i18next'
import type { UiTheme } from '../../../shared/types'
import styles from './ThemeSection.module.css'

interface ThemeSectionProps {
  value: UiTheme
  onChange: (theme: UiTheme) => void
}

export function ThemeSection({ value, onChange }: ThemeSectionProps) {
  const { t } = useTranslation()
  return (
    <div className="section">
      <span className="label" id="theme-group-label">
        {t('popup.uiTheme')}
      </span>
      <ToggleGroup.Root
        type="single"
        value={value}
        onValueChange={(val) => {
          if (val) onChange(val as UiTheme)
        }}
        className={styles.group}
        aria-labelledby="theme-group-label"
      >
        <ToggleGroup.Item value="dark" className={styles.btn}>
          <span className={styles.icon}>🌙</span>
          {t('popup.themeDark')}
        </ToggleGroup.Item>
        <ToggleGroup.Item value="light" className={styles.btn}>
          <span className={styles.icon}>☀️</span>
          {t('popup.themeLight')}
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  )
}
