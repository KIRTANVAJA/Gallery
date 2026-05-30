import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { getLocalSettings } from '../../utils/localDB'

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const [settings, setSettings] = useState(() => getLocalSettings())

  useEffect(() => {
    const handleUpdate = () => setSettings(getLocalSettings())
    window.addEventListener('gallery_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('gallery_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section
      id="hero"
      ref={ref}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <motion.div className="absolute inset-0" style={{ y }}>
        <div className="absolute inset-0 animate-slow-zoom">
          <img
            src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920&q=85"
            alt=""
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-charcoal" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/40 via-transparent to-charcoal/40" />
      </motion.div>

      <motion.div
        className="relative z-10 mx-auto max-w-5xl px-6 text-center"
        style={{ opacity }}
      >
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 2.4, ease: [0.22, 1, 0.36, 1] }}
          className="font-body text-xs tracking-[0.4em] text-gold uppercase mb-8"
        >
          {settings.subtitle}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.4, delay: 2.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-wide text-cream leading-[1.1] uppercase"
        >
          {settings.title.toLowerCase().includes('silences') ? (
            <>
              {settings.title.substring(0, settings.title.toLowerCase().lastIndexOf('silences'))}
              <br />
              <span className="text-gradient-gold italic font-heading font-light lowercase">
                {settings.title.substring(settings.title.toLowerCase().lastIndexOf('silences'))}
              </span>
            </>
          ) : (
            settings.title
          )}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 3 }}
          className="mt-10 space-y-4"
        >
          <p className="font-heading text-lg md:text-xl text-cream-muted italic">
            "Captured in silences, curated in light."
          </p>
        </motion.div>

        <motion.a
          href="#gallery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.4, duration: 1 }}
          className="cursor-hover mt-14 inline-block font-body text-xs tracking-[0.3em] text-gold uppercase border border-gold/30 px-8 py-4 transition-all duration-500 hover:bg-gold/10 hover:border-gold/60 hover:shadow-[0_0_40px_rgba(201,169,98,0.15)]"
        >
          Explore the Gallery
        </motion.a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.8, duration: 1 }}
        className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-3"
        aria-hidden="true"
      >
        <span className="font-body text-[10px] tracking-[0.3em] text-cream-muted uppercase">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="h-10 w-px bg-gradient-to-b from-gold/80 to-transparent"
        />
      </motion.div>
    </section>
  )
}
