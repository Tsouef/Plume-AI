import { TonePreset } from '../../../../shared/types'

interface TonePillsBarProps {
  onSelectTone: (tone: TonePreset) => void
}

const TONES: Array<[TonePreset, string]> = [
  ['shorter', 'Shorter'],
  ['formal', 'Formal'],
  ['direct', 'Direct'],
  ['technical', 'Technical'],
]

export function TonePillsBar({ onSelectTone }: TonePillsBarProps) {
  return (
    <div className="tone-bar">
      {TONES.map(([tone, label]) => (
        <button
          key={tone}
          className="btn-tone"
          data-tone={tone}
          onClick={() => onSelectTone(tone)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
