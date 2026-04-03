import { AnimatePresence, motion } from 'motion/react'
import styles from './SavedMessage.module.css'

interface SavedMessageProps {
  visible: boolean
}

export function SavedMessage({ visible }: SavedMessageProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          className={styles.savedMsg}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          Saved
        </motion.p>
      )}
    </AnimatePresence>
  )
}
