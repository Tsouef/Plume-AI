import { useEffect, useState } from 'react'
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
        if (!tab?.url) return
        try {
          const { hostname, protocol } = new URL(tab.url)
          if (protocol === 'https:' || protocol === 'http:') setCurrentDomain(hostname)
        } catch {
          // Unparseable URL — ignore
        }
      })
      .catch(() => {
        // tabs.query unavailable in test environments
      })
  }, [])

  if (!currentDomain) return null

  const isTrusted = trustedDomains.includes(currentDomain)

  return (
    <div className="section">
      <span className="label">{t('popup.currentSite')}</span>
      <div className={styles.row}>
        <span className={styles.domain}>{currentDomain}</span>
        <button
          type="button"
          className={isTrusted ? styles.revokeBtn : styles.grantBtn}
          onClick={() => (isTrusted ? onRevoke(currentDomain) : onGrant(currentDomain))}
        >
          {isTrusted ? t('popup.disableSite') : t('popup.enableSite')}
        </button>
      </div>
    </div>
  )
}
