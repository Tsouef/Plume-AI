interface AIResultViewProps {
  text: string
  label: string
  primaryLabel: string
  secondaryLabel: string
  onPrimary: () => void
  onSecondary: () => void
}

export function AIResultView({
  text,
  label,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: AIResultViewProps) {
  return (
    <>
      <div
        className="ai-result"
        aria-live="polite"
        aria-atomic="true"
        role="region"
        aria-label={label}
      >
        {text}
      </div>
      <div className="actions">
        <button className="btn-primary" onClick={onPrimary}>
          {primaryLabel}
        </button>
        <button className="btn-secondary" onClick={onSecondary}>
          {secondaryLabel}
        </button>
      </div>
    </>
  )
}
