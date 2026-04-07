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

  function renderStatus() {
    if (state.type === 'checking') {
      return (
        <span className="status">
          <Spinner />
          {t('panel.checking')}
        </span>
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
        <span className="status">
          <span className="status-icon error">⚠</span>
          {msg}
          {isNoProvider && onOpenSettings && (
            <button className="btn-open-settings" onClick={onOpenSettings}>
              {t('panel.openSettings')}
            </button>
          )}
        </span>
      )
    }

    if (state.type === 'translating') {
      return (
        <span className="status">
          <Spinner />
          {t('panel.translating')}
        </span>
      )
    }

    if (state.type === 'ai-rewriting') {
      return (
        <span className="status">
          <Spinner />
          {t('panel.rewriting')}
        </span>
      )
    }

    if (state.type === 'translate-result') {
      return (
        <span className="status">
          <span className="status-icon info">✦</span>
          {t('panel.translation')}
        </span>
      )
    }

    if (state.type === 'ai-result') {
      return (
        <span className="status">
          <span className="status-icon info">✦</span>
          {t('panel.aiSuggestion')}
        </span>
      )
    }

    if (state.type === 'results') {
      if (isRechecking) {
        return (
          <span className="status">
            <Spinner />
            {t('panel.checking')}
          </span>
        )
      }
      const count = matchedErrorCount ?? state.errors.length
      if (count === 0) {
        return <span className="status">✅ {t('panel.looksGood')}</span>
      }
      return (
        <span className="status">
          <span className="status-icon warning">●</span>
          {` ${t('panel.issueCount', { count })}`}
        </span>
      )
    }

    return null
  }

  const showPolishButton = state.type === 'results'

  return (
    <div className="header">
      {renderStatus()}
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
