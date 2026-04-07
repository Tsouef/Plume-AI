import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import styles from './SavedMessage.module.css'

interface SavedMessageProps {
  visible: boolean
}

export function SavedMessage({ visible }: SavedMessageProps) {
  const { t } = useTranslation()
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {visible && (
          <motion.p
            className={styles.savedMsg}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {t('popup.saved')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
