import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { useTranslation } from 'react-i18next'
import type { TonePreset } from '../../../../shared/types'

interface TonePillsBarProps {
  onSelectTone: (tone: TonePreset) => void
}

const TONES: TonePreset[] = ['shorter', 'formal', 'direct', 'technical']

export function TonePillsBar({ onSelectTone }: TonePillsBarProps) {
  const { t } = useTranslation()

  return (
    <ToggleGroup.Root
      type="single"
      className="tone-bar"
      aria-label={t('panel.toneOptions')}
      onValueChange={(value) => {
        if (value) onSelectTone(value as TonePreset)
      }}
    >
      {TONES.map((tone) => (
        <ToggleGroup.Item key={tone} value={tone} className="btn-tone" data-tone={tone}>
          {t(`tone.${tone}`)}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
