import { motion } from 'framer-motion'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-white/5 dark:border-white/5 border-black/10 bg-[var(--bg-secondary)]">
      <div className="section-padding !py-16 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="flex flex-col items-center text-center"
        >
          <a
            href="#hero"
            className="cursor-hover font-display text-lg tracking-[0.4em] text-cream uppercase transition-colors hover:text-gold"
          >
            Capture in Silences
          </a>

          <div className="my-8 h-px w-24 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

          <p className="font-body text-xs tracking-[0.15em] text-cream-muted">
            © {year} Capture in Silences. All rights reserved.
          </p>
          <p className="font-heading text-sm text-cream-muted/60 mt-3 italic">
            Some moments are too quiet for words.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
