import { useState } from 'react'
import { motion } from 'motion/react'
import { useConfig } from './hooks/useConfig'
import type { Config } from '../shared/types'
import { EASE_OUT, SAVED_VISIBLE_DURATION_MS } from '../shared/constants'
import styles from './App.module.css'
import { ApiKeySection } from './components/ApiKeySection/ApiKeySection'
import { LanguageSection } from './components/LanguageSection/LanguageSection'
import { DisabledSitesSection } from './components/DisabledSitesSection/DisabledSitesSection'
import { SaveButton } from './components/SaveButton/SaveButton'
import { SavedMessage } from './components/SavedMessage/SavedMessage'

const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
}

export default function App() {
  const { config, saveConfig } = useConfig()
  if (!config) return null
  return <AppForm config={config} saveConfig={saveConfig} />
}

interface AppFormProps {
  config: Config
  saveConfig: (c: Config) => Promise<void>
}

function AppForm({ config, saveConfig }: AppFormProps) {
  const geminiProvider = config.providers.find((p) => p.id === 'gemini')
  const [apiKey, setApiKey] = useState(geminiProvider?.apiKey ?? '')
  const [language, setLanguage] = useState<Config['language']>(config.language)
  const [domains, setDomains] = useState([...config.disabledDomains])
  const [keyVisible, setKeyVisible] = useState(false)
  const [keyError, setKeyError] = useState(false)
  const [savedVisible, setSavedVisible] = useState(false)

  function handleAddDomain(domain: string) {
    setDomains((prev) => [...prev, domain])
  }

  function handleRemoveDomain(domain: string) {
    setDomains((prev) => prev.filter((d) => d !== domain))
  }

  async function handleSave() {
    if (!apiKey.trim()) {
      setKeyError(true)
      return
    }
    setKeyError(false)

    const newConfig: Config = {
      activeProvider: 'gemini',
      providers: [{ id: 'gemini', apiKey: apiKey.trim() }],
      language,
      disabledDomains: domains,
    }
    await saveConfig(newConfig)

    setSavedVisible(true)
    setTimeout(() => setSavedVisible(false), SAVED_VISIBLE_DURATION_MS)
  }

  return (
    <>
      <h1 className={styles.heading}>
        <span className={styles.logoIcon}>✦</span>
        Grammar Assistant
      </h1>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={sectionVariants}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <ApiKeySection
            value={apiKey}
            onChange={setApiKey}
            visible={keyVisible}
            onToggleVisible={() => setKeyVisible((v) => !v)}
            error={keyError}
          />
        </motion.div>
        <motion.div
          variants={sectionVariants}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <LanguageSection value={language} onChange={setLanguage} />
        </motion.div>
        <motion.div
          variants={sectionVariants}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <DisabledSitesSection
            domains={domains}
            onAdd={handleAddDomain}
            onRemove={handleRemoveDomain}
          />
        </motion.div>
        <motion.div
          variants={sectionVariants}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <SaveButton onClick={handleSave} />
          <SavedMessage visible={savedVisible} />
        </motion.div>
      </motion.div>
    </>
  )
}

