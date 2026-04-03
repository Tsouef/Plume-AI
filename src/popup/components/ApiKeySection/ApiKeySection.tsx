import styles from './ApiKeySection.module.css'

interface ApiKeySectionProps {
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggleVisible: () => void
  error: boolean
}

export function ApiKeySection({ value, onChange, visible, onToggleVisible, error }: ApiKeySectionProps) {
  return (
    <div className="section">
      <label className="label" htmlFor="api-key">Gemini API key</label>
      <div className={styles.inputRow}>
        <input
          type={visible ? 'text' : 'password'}
          id="api-key"
          placeholder="AIza..."
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button className={styles.btnIcon} onClick={onToggleVisible} title="Show/hide">
          👁
        </button>
      </div>
      {error && (
        <p className={styles.errorMsg}>API key required</p>
      )}
    </div>
  )
}
