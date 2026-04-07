import styles from './DomainTag.module.css'

interface DomainTagProps {
  domain: string
  onRemove: () => void
}

export function DomainTag({ domain, onRemove }: DomainTagProps) {
  return (
    <div className={styles.domainTag}>
      {domain}
      <button onClick={onRemove} aria-label={`Remove ${domain}`}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}
