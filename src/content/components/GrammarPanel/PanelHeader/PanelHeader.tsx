import { useTranslation } from 'react-i18next'
import { TonePreset, ProviderId } from '../../../../shared/types'
import { PanelState } from '../../../hooks/usePanelState'
import { Spinner } from '../Spinner/Spinner'

interface PanelHeaderProps {
  state: PanelState
  matchedErrorCount?: number
  activeProvider: ProviderId
  isRechecking?: boolean
  onRequestAI: (tone?: TonePreset) => void
  onOpenSettings?: () => void
}

export function PanelHeader({
  state,
  matchedErrorCount,
  activeProvider,
  isRechecking,
  onRequestAI,
  onOpenSettings,
}: PanelHeaderProps) {
  const { t } = useTranslation()

  function renderStatusContent() {
    if (state.type === 'checking') {
      return (
        <>
          <Spinner />
          {t('panel.checking')}
        </>
      )
    }

    if (state.type === 'error') {
      const isNoProvider = state.message === 'NO_PROVIDER_CONFIGURED'
      const msg = isNoProvider
        ? t('panel.configureProvider')
        : state.message.includes('Invalid API key')
          ? state.message
          : state.message.includes('unreachable')
            ? t('error.serviceUnreachable')
            : state.message.includes('timed out')
              ? t('error.requestTimedOut')
              : state.message.includes('Rate limit')
                ? t('error.rateLimited')
                : state.message
      return (
        <>
          <span className="status-icon error">⚠</span>
          {msg}
          {isNoProvider && onOpenSettings && (
            <button className="btn-open-settings" onClick={onOpenSettings}>
              {t('panel.openSettings')}
            </button>
          )}
        </>
      )
    }

    if (state.type === 'translating') {
      return (
        <>
          <Spinner />
          {t('panel.translating')}
        </>
      )
    }

    if (state.type === 'ai-rewriting') {
      return (
        <>
          <Spinner />
          {t('panel.rewriting')}
        </>
      )
    }

    if (state.type === 'translate-result') {
      return (
        <>
          <span className="status-icon info">✦</span>
          {t('panel.translation')}
        </>
      )
    }

    if (state.type === 'ai-result') {
      return (
        <>
          <span className="status-icon info">✦</span>
          {t('panel.aiSuggestion')}
        </>
      )
    }

    if (state.type === 'results') {
      if (isRechecking) {
        return (
          <>
            <Spinner />
            {t('panel.checking')}
          </>
        )
      }
      const count = matchedErrorCount ?? state.errors.length
      if (count === 0) {
        return <>✅ {t('panel.looksGood')}</>
      }
      return (
        <>
          <span className="status-icon warning">●</span>
          {` ${t('panel.issueCount', { count })}`}
        </>
      )
    }

    return null
  }

  const showPolishButton = state.type === 'results'

  return (
    <div className="header">
      <span id="grammar-panel-status" className="status" aria-live="polite" aria-atomic="true">
        {renderStatusContent()}
      </span>
      {showPolishButton && (
        <button className="btn-polish" onClick={() => onRequestAI(undefined)}>
          {t('panel.polish')}
        </button>
      )}
      {activeProvider === 'ollama' && (
        <span className="local-mode-badge">{t('panel.localMode')}</span>
      )}
    </div>
  )
}
