import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useConfig } from './hooks/useConfig'
import type { Config, ProviderId, UiLocale, UiTheme } from '../shared/types'
import { EASE_OUT, SAVED_VISIBLE_DURATION_MS } from '../shared/constants'
import { PROVIDER_IDS } from '../shared/models'
import i18n from '../shared/i18n/i18n'
import styles from './App.module.css'
import { ProviderSection } from './components/ProviderSection/ProviderSection'
import type { PerProviderState } from './components/ProviderSection/ProviderSection'
import { LanguageSection } from './components/LanguageSection/LanguageSection'
import { UiLanguageSection } from './components/UiLanguageSection/UiLanguageSection'
import { ThemeSection } from './components/ThemeSection/ThemeSection'
import { ManualModeSection } from './components/ManualModeSection/ManualModeSection'
import { DisabledSitesSection } from './components/DisabledSitesSection/DisabledSitesSection'
import { SitePermissionSection } from './components/SitePermissionSection/SitePermissionSection'
import { SaveButton } from './components/SaveButton/SaveButton'
import { SavedMessage } from './components/SavedMessage/SavedMessage'

const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export default function App() {
  const { config, saveConfig } = useConfig()

  const theme = config?.uiTheme ?? 'dark'
  useEffect(() => {
    document.body.dataset.theme = theme
  }, [theme])

  if (!config) return null
  return <AppForm config={config} saveConfig={saveConfig} />
}

interface AppFormProps {
  config: Config
  saveConfig: (c: Config) => Promise<void>
}

function initialPerProviderState(config: Config): Record<ProviderId, PerProviderState> {
  const result = {} as Record<ProviderId, PerProviderState>
  for (const id of PROVIDER_IDS) {
    const stored = config.providers.find((p) => p.id === id)
    result[id] = {
      apiKey: stored?.apiKey ?? '',
      model: stored?.model ?? '',
      baseUrl: stored?.baseUrl ?? (id === 'ollama' ? 'http://localhost:11434' : ''),
    }
  }
  return result
}

function AppForm({ config, saveConfig }: AppFormProps) {
  const { t } = useTranslation()
  const [activeProvider, setActiveProvider] = useState<ProviderId>(config.activeProvider)
  const [providerStates, setProviderStates] = useState<Record<ProviderId, PerProviderState>>(() =>
    initialPerProviderState(config)
  )
  const [language, setLanguage] = useState<Config['language']>(config.language)
  const [uiLanguage, setUiLanguage] = useState<UiLocale>(config.uiLanguage)
  const [uiTheme, setUiTheme] = useState<UiTheme>(config.uiTheme ?? 'dark')
  const [manualOnly, setManualOnly] = useState(config.manualOnly ?? false)
  const [domains, setDomains] = useState([...config.disabledDomains])
  const [trustedDomains, setTrustedDomains] = useState([...config.trustedDomains])
  const [errors, setErrors] = useState<{ apiKey?: boolean; baseUrl?: boolean; model?: boolean }>({})
  const [savedVisible, setSavedVisible] = useState(false)

  useEffect(() => {
    i18n.changeLanguage(uiLanguage)
  }, [uiLanguage])
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [ollamaModelsStatus, setOllamaModelsStatus] = useState<'idle' | 'loading' | 'error'>(
    config.activeProvider === 'ollama' ? 'loading' : 'idle'
  )

  const ollamaBaseUrl = providerStates.ollama.baseUrl

  useEffect(() => {
    if (activeProvider !== 'ollama' || !ollamaBaseUrl) return
    let cancelled = false
    chrome.runtime
      .sendMessage({ type: 'GET_OLLAMA_MODELS', baseUrl: ollamaBaseUrl })
      .then((response: { models: string[] }) => {
        if (!cancelled) {
          setOllamaModels(response?.models ?? [])
          setOllamaModelsStatus('idle')
        }
      })
      .catch(() => {
        if (!cancelled) setOllamaModelsStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [activeProvider, ollamaBaseUrl])

  function handleProviderChange(id: ProviderId) {
    setActiveProvider(id)
    setErrors({})
    if (id === 'ollama') setOllamaModelsStatus('loading')
  }

  function handleStateChange(id: ProviderId, patch: Partial<PerProviderState>) {
    setProviderStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
    if (id === 'ollama' && patch.baseUrl !== undefined) setOllamaModelsStatus('loading')
  }

  function handleUiLanguageChange(locale: UiLocale) {
    setUiLanguage(locale)
    i18n.changeLanguage(locale)
  }

  function handleUiThemeChange(theme: UiTheme) {
    setUiTheme(theme)
    document.body.dataset.theme = theme
  }

  function handleAddDomain(domain: string) {
    const newDomains = [...domains, domain]
    setDomains(newDomains)
    saveConfig({ ...config, disabledDomains: newDomains })
  }

  function handleRemoveDomain(domain: string) {
    const newDomains = domains.filter((d) => d !== domain)
    setDomains(newDomains)
    saveConfig({ ...config, disabledDomains: newDomains })
  }

  async function handleGrantDomain(domain: string) {
    const granted = await chrome.permissions.request({ origins: [`*://${domain}/*`] })
    if (!granted) return
    const newDomains = [...trustedDomains, domain]
    setTrustedDomains(newDomains)
    saveConfig({ ...config, trustedDomains: newDomains })
  }

  async function handleRevokeDomain(domain: string) {
    const removed = await chrome.permissions.remove({ origins: [`*://${domain}/*`] })
    if (!removed) return
    const newDomains = trustedDomains.filter((d) => d !== domain)
    setTrustedDomains(newDomains)
    saveConfig({ ...config, trustedDomains: newDomains })
  }

  async function handleSave() {
    const state = providerStates[activeProvider]
    if (activeProvider !== 'ollama' && !state.apiKey.trim()) {
      setErrors({ apiKey: true })
      return
    }
    if (activeProvider === 'ollama' && !state.baseUrl.trim()) {
      setErrors({ baseUrl: true })
      return
    }
    if (activeProvider === 'ollama' && !state.model.trim()) {
      setErrors({ model: true })
      return
    }
    setErrors({})

    const providers = PROVIDER_IDS.map((id) => {
      const s = providerStates[id]
      if (id === 'ollama') return { id, baseUrl: s.baseUrl, model: s.model }
      return { id, apiKey: s.apiKey.trim(), model: s.model }
    })

    const newConfig: Config = {
      activeProvider,
      providers,
      language,
      uiLanguage,
      uiTheme,
      disabledDomains: domains,
      manualOnly,
      trustedDomains,
    }
    await saveConfig(newConfig)

    setSavedVisible(true)
    setTimeout(() => setSavedVisible(false), SAVED_VISIBLE_DURATION_MS)
  }

  return (
    <>
      <h1 className={styles.heading}>
        <span className={styles.logoIcon}>✦</span>
        {t('popup.heading')}
      </h1>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={sectionVariants} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <ProviderSection
            activeProvider={activeProvider}
            providerStates={providerStates}
            onProviderChange={handleProviderChange}
            onStateChange={handleStateChange}
            errors={errors}
            ollamaModels={ollamaModels}
            ollamaModelsStatus={ollamaModelsStatus}
          />
        </motion.div>
        <motion.div variants={sectionVariants} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <LanguageSection value={language} onChange={setLanguage} />
        </motion.div>
        <motion.div variants={sectionVariants} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <UiLanguageSection value={uiLanguage} onChange={handleUiLanguageChange} />
        </motion.div>
        <motion.div variants={sectionVariants} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <ManualModeSection value={manualOnly} onChange={setManualOnly} />
        </motion.div>
        <motion.div variants={sectionVariants} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <ThemeSection value={uiTheme} onChange={handleUiThemeChange} />
        </motion.div>
        <motion.div variants={sectionVariants} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <DisabledSitesSection
            domains={domains}
            onAdd={handleAddDomain}
            onRemove={handleRemoveDomain}
          />
        </motion.div>
        <motion.div variants={sectionVariants} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <SitePermissionSection
            trustedDomains={trustedDomains}
            onGrant={handleGrantDomain}
            onRevoke={handleRevokeDomain}
          />
        </motion.div>
        <motion.div variants={sectionVariants} transition={{ duration: 0.3, ease: EASE_OUT }}>
          <SaveButton onClick={handleSave} />
          <SavedMessage visible={savedVisible} />
        </motion.div>
      </motion.div>
    </>
  )
}
