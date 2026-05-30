import { motion } from 'framer-motion'
import { MasonryGrid } from '../gallery/MasonryGrid'
import { useTranslation } from '../../hooks/useTranslation'

export function Gallery() {
  const { t } = useTranslation()

  return (
    <section id="gallery" className="relative section-padding bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <p className="font-body text-xs tracking-[0.4em] text-gold uppercase mb-4">
            {t('gallery')}
          </p>
          <h2 className="font-display text-3xl md:text-5xl tracking-wide text-cream">
            {t('explore')}
          </h2>
          <p className="font-heading text-lg text-cream-muted italic mt-6 max-w-xl mx-auto">
            Frames woven from light, shadow, and the spaces between words.
          </p>
        </motion.div>

        <MasonryGrid />
      </div>
    </section>
  )
}
