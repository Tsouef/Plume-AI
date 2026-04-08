import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './SitePermissionSection.module.css'

interface SitePermissionSectionProps {
  trustedDomains: string[]
  onGrant: (domain: string) => void
  onRevoke: (domain: string) => void
}

export function SitePermissionSection({
  trustedDomains,
  onGrant,
  onRevoke,
}: SitePermissionSectionProps) {
  const { t } = useTranslation()
  const [currentDomain, setCurrentDomain] = useState<string | null>(null)

  useEffect(() => {
    if (!chrome.tabs) return
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => {
        try {
          const { hostname, protocol } = new URL(tab.url ?? '')
          if (protocol === 'https:' || protocol === 'http:') {
            setCurrentDomain(hostname)
          }
        } catch {
          // Non-http URL (chrome://, about:, etc.) — don't show banner
        }
      })
      .catch(() => {})
  }, [])

  if (!currentDomain) return null

  const isTrusted = trustedDomains.includes(currentDomain)

  return (
    <div className={isTrusted ? styles.bannerActive : styles.bannerInactive}>
      <span className={styles.icon} aria-hidden="true">
        {isTrusted ? <span className={styles.dot} /> : '🔒'}
      </span>
      <div className={styles.text}>
        <strong className={styles.title}>
          {isTrusted ? t('popup.siteEnabled') : t('popup.siteNotEnabled')}
        </strong>
        <span className={styles.domain}>{currentDomain}</span>
      </div>
      <button
        type="button"
        className={isTrusted ? styles.revokeBtn : styles.grantBtn}
        onClick={() => (isTrusted ? onRevoke(currentDomain) : onGrant(currentDomain))}
      >
        {isTrusted ? t('popup.disableSite') : t('popup.enableSite')}
      </button>
    </div>
  )
}
