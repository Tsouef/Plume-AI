import * as Toast from '@radix-ui/react-toast'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import styles from './SavedMessage.module.css'

interface SavedMessageProps {
  visible: boolean
}

export function SavedMessage({ visible }: SavedMessageProps) {
  const { t } = useTranslation()
  return (
    <Toast.Root open={visible} type="background" className={styles.toastRoot}>
      <Toast.Title asChild>
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
      </Toast.Title>
    </Toast.Root>
  )
}
