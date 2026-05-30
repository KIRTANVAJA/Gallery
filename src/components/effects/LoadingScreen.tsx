import { AnimatePresence, motion } from 'framer-motion'

interface LoadingScreenProps {
  visible: boolean
}

export function LoadingScreen({ visible }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[10001] flex flex-col items-center justify-center bg-charcoal"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(12px)' }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-label="Loading"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-center"
          >
            <p className="font-display text-xs tracking-[0.5em] text-gold uppercase mb-6">
              Capture in Silences
            </p>
            <motion.div
              className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent"
              animate={{ scaleX: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <p className="font-heading text-cream-muted text-sm mt-8 italic tracking-wide">
              Loading silence...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
