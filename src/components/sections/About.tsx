import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { getLocalSettings } from '../../utils/localDB'
import { subscribeSettings } from '../../utils/localDB'

export function About() {
  const ref = useRef<HTMLElement>(null)
  const [settings, setSettings] = useState(() => getLocalSettings())

  useEffect(() => {
    const unsubscribe = subscribeSettings((latestSettings) => {
      setSettings(latestSettings)
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const imageY = useTransform(scrollYProgress, [0, 1], ['8%', '-8%'])

  return (
    <section
      id="about"
      ref={ref}
      className="relative section-padding overflow-hidden bg-[var(--bg-secondary)]"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            className="relative overflow-hidden rounded-sm"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div style={{ y: imageY }} className="relative aspect-[4/5] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1554048612-b6a482b17d2c?w=800&q=80"
                alt="Photographer portrait"
                className="h-[110%] w-full object-cover object-top"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-light via-transparent to-transparent opacity-60" />
            </motion.div>
            <div className="absolute -bottom-4 -right-4 h-32 w-32 border border-gold/20 pointer-events-none" aria-hidden="true" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-body text-xs tracking-[0.4em] text-gold uppercase mb-6">
              The Artist
            </p>
            <h2 className="font-display text-3xl md:text-4xl tracking-wide text-cream leading-tight uppercase">
              {settings.bioTitle.includes(' ') ? (
                <>
                  {settings.bioTitle.substring(0, settings.bioTitle.indexOf(' '))}
                  <br />
                  <span className="font-heading italic font-light text-cream-muted lowercase">
                    {settings.bioTitle.substring(settings.bioTitle.indexOf(' '))}
                  </span>
                </>
              ) : (
                settings.bioTitle
              )}
            </h2>

            <div className="mt-10 space-y-6 font-body text-sm md:text-base leading-relaxed text-cream-muted">
              {settings.bioDescription.split('\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            <motion.div
              className="mt-12 flex gap-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 1 }}
            >
              {[
                { value: '12+', label: 'Years' },
                { value: '40+', label: 'Countries' },
                { value: '∞', label: 'Silences' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl text-gold">{stat.value}</p>
                  <p className="font-body text-xs tracking-widest text-cream-muted uppercase mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
