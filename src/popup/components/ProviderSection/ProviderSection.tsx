import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './ProviderSection.module.css'
import type {
  ProviderId,
  TestConnectionMessage,
  TestConnectionResponse,
} from '../../../shared/types'
import {
  PROVIDER_MODELS,
  PROVIDER_LABELS,
  API_KEY_LABELS,
  PROVIDER_IDS,
} from '../../../shared/models'

export type PerProviderState = { apiKey: string; model: string; baseUrl: string }

interface ProviderSectionErrors {
  apiKey?: boolean
  baseUrl?: boolean
  model?: boolean
}

interface ProviderSectionProps {
  activeProvider: ProviderId
  providerStates: Record<ProviderId, PerProviderState>
  onProviderChange: (id: ProviderId) => void
  onStateChange: (id: ProviderId, patch: Partial<PerProviderState>) => void
  errors: ProviderSectionErrors
  ollamaModels: string[]
  ollamaModelsStatus: 'idle' | 'loading' | 'error'
}

export function ProviderSection({
  activeProvider,
  providerStates,
  onProviderChange,
  onStateChange,
  errors,
  ollamaModels,
  ollamaModelsStatus,
}: ProviderSectionProps) {
  const { t } = useTranslation()
  const state = providerStates[activeProvider]
  const isOllama = activeProvider === 'ollama'

  type TestStatus = 'idle' | 'testing' | 'ok' | 'error'
  const [testResult, setTestResult] = useState<{
    status: TestStatus
    error: string
    testedKey: string
  }>({ status: 'idle', error: '', testedKey: '' })

  // Derive display state: result is stale if the key/provider changed since last test
  const currentKey = `${activeProvider}|${state.apiKey}|${state.baseUrl}`
  const testStatus = testResult.testedKey === currentKey ? testResult.status : 'idle'
  const testError = testResult.testedKey === currentKey ? testResult.error : ''

  async function handleTest() {
    setTestResult({ status: 'testing', error: '', testedKey: currentKey })
    const msg: TestConnectionMessage = {
      type: 'TEST_CONNECTION',
      providerId: activeProvider,
      apiKey: state.apiKey || undefined,
      model: state.model || undefined,
      baseUrl: state.baseUrl || undefined,
    }
    try {
      const response: TestConnectionResponse = await chrome.runtime.sendMessage(msg)
      if (response.ok) {
        setTestResult({ status: 'ok', error: '', testedKey: currentKey })
      } else {
        setTestResult({ status: 'error', error: response.error, testedKey: currentKey })
      }
    } catch {
      setTestResult({
        status: 'error',
        error: t('popup.testConnectionError'),
        testedKey: currentKey,
      })
    }
  }

  const showTestBtn = isOllama || !!state.apiKey

  return (
    <div className="section">
      {/* Provider selector */}
      <label className="label" htmlFor="provider-select">
        {t('popup.provider')}
      </label>
      <select
        id="provider-select"
        value={activeProvider}
        onChange={(e) => onProviderChange(e.target.value as ProviderId)}
      >
        {PROVIDER_IDS.map((id) => (
          <option key={id} value={id}>
            {PROVIDER_LABELS[id]}
          </option>
        ))}
      </select>

      {/* API key — cloud providers only */}
      {!isOllama && (
        <div className={styles.field}>
          <label className="label" htmlFor="api-key">
            {API_KEY_LABELS[activeProvider as Exclude<ProviderId, 'ollama'>]}
          </label>
          <div className={styles.inputRow}>
            <input
              type="password"
              id="api-key"
              autoComplete="off"
              value={state.apiKey}
              onChange={(e) => onStateChange(activeProvider, { apiKey: e.target.value })}
            />
            {showTestBtn && (
              <button
                className={styles.testBtn}
                onClick={handleTest}
                disabled={testStatus === 'testing'}
              >
                {testStatus === 'testing' ? '…' : t('popup.testConnection')}
              </button>
            )}
          </div>
          {errors.apiKey && <p className={styles.errorMsg}>{t('popup.apiKeyRequired')}</p>}
          {testStatus === 'ok' && (
            <p className={`${styles.testResult} ${styles.ok}`}>✓ {t('popup.testConnectionOk')}</p>
          )}
          {testStatus === 'error' && (
            <p className={`${styles.testResult} ${styles.error}`}>
              {testError || t('popup.testConnectionError')}
            </p>
          )}
        </div>
      )}

      {/* Base URL — Ollama only */}
      {isOllama && (
        <div className={styles.field}>
          <label className="label" htmlFor="base-url">
            {t('popup.baseUrl')}
          </label>
          <div className={styles.inputRow}>
            <input
              type="text"
              id="base-url"
              placeholder="http://localhost:11434"
              value={state.baseUrl}
              onChange={(e) => onStateChange('ollama', { baseUrl: e.target.value })}
            />
            <button
              className={styles.testBtn}
              onClick={handleTest}
              disabled={testStatus === 'testing'}
            >
              {testStatus === 'testing' ? '…' : t('popup.testConnection')}
            </button>
          </div>
          {errors.baseUrl && <p className={styles.errorMsg}>{t('popup.baseUrlRequired')}</p>}
          {testStatus === 'ok' && (
            <p className={`${styles.testResult} ${styles.ok}`}>✓ {t('popup.testConnectionOk')}</p>
          )}
          {testStatus === 'error' && (
            <p className={`${styles.testResult} ${styles.error}`}>
              {testError || t('popup.testConnectionError')}
            </p>
          )}
        </div>
      )}

      {/* Model selector */}
      <div className={styles.field}>
        <label className="label" htmlFor="model-select">
          {t('popup.model')}
        </label>
        {isOllama ? (
          ollamaModelsStatus === 'loading' ? (
            <p className={styles.statusMsg}>{t('popup.loadingModels')}</p>
          ) : ollamaModelsStatus === 'error' ? (
            <p className={styles.errorMsg}>{t('popup.ollamaUnreachable')}</p>
          ) : (
            <>
              <select
                id="model-select"
                value={state.model}
                onChange={(e) => onStateChange('ollama', { model: e.target.value })}
              >
                {!state.model && <option value="">{t('popup.selectModel')}</option>}
                {ollamaModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {errors.model && <p className={styles.errorMsg}>{t('popup.modelRequired')}</p>}
            </>
          )
        ) : (
          <select
            id="model-select"
            value={
              state.model || PROVIDER_MODELS[activeProvider as Exclude<ProviderId, 'ollama'>][0]
            }
            onChange={(e) => onStateChange(activeProvider, { model: e.target.value })}
          >
            {PROVIDER_MODELS[activeProvider as Exclude<ProviderId, 'ollama'>].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
