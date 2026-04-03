import { motion } from 'motion/react'
import styles from './SaveButton.module.css'

interface SaveButtonProps {
  onClick: () => void
}

export function SaveButton({ onClick }: SaveButtonProps) {
  return (
    <motion.button
      className={styles.btnSave}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
    >
      Save settings
    </motion.button>
  )
}
