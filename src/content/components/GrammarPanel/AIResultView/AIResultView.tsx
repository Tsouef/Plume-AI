interface AIResultViewProps {
  text: string
  primaryLabel: string
  secondaryLabel: string
  onPrimary: () => void
  onSecondary: () => void
}

export function AIResultView({
  text,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}: AIResultViewProps) {
  return (
    <>
      <div className="ai-result">{text}</div>
      <div className="actions">
        <button className="btn-primary" onClick={onPrimary}>{primaryLabel}</button>
        <button className="btn-secondary" onClick={onSecondary}>{secondaryLabel}</button>
      </div>
    </>
  )
}
