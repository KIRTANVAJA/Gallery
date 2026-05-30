import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAdminAccess } from '../../context/AdminAccessContext'
import { useTranslation } from '../../hooks/useTranslation'

interface NavbarProps {
  onToggleTheme: () => void
  isDark: boolean
  onToggleMusic: () => void
  musicPlaying: boolean
}

export function Navbar({
  onToggleTheme,
  isDark,
  onToggleMusic,
  musicPlaying,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { startHolding, stopHolding, holdProgress, isHolding } = useAdminAccess()
  const { lang, setLang, t } = useTranslation()

  const navLinks = [
    { label: t('gallery'), href: '#gallery' },
    { label: t('about'), href: '#about' },
    { label: t('contact'), href: '#contact' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.2, delay: 2.2, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled ? 'glass-nav shadow-lg shadow-black/20' : 'bg-transparent'
      }`}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12"
        aria-label="Main navigation"
      >
        <div
          className="relative inline-flex items-center justify-center py-2.5 px-5 select-none touch-none"
          onMouseDown={(e) => {
            if (e.button === 0) startHolding()
          }}
          onMouseUp={stopHolding}
          onMouseLeave={stopHolding}
          onTouchStart={() => {
            // Prevent zoom/scroll side effects on touch
            startHolding()
          }}
          onTouchEnd={stopHolding}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            transform: `scale(${1 + holdProgress * 0.08})`,
            transition: isHolding ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Glow effect underneath */}
          <div
            className="absolute inset-0 rounded-lg blur-md bg-gold/10 transition-opacity pointer-events-none"
            style={{
              opacity: holdProgress,
              boxShadow: `0 0 ${holdProgress * 40}px rgba(201, 169, 98, ${holdProgress * 0.7})`,
            }}
          />

          {/* Contour outline progress */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <rect
              x="1.5"
              y="1.5"
              width="97"
              height="97"
              rx="6"
              fill="none"
              stroke="rgba(201, 169, 98, 0.08)"
              strokeWidth="1.5"
            />
            <rect
              x="1.5"
              y="1.5"
              width="97"
              height="97"
              rx="6"
              fill="none"
              stroke="#c9a962"
              strokeWidth="2"
              strokeDasharray="388"
              strokeDashoffset={388 - holdProgress * 388}
              style={{
                transition: isHolding ? 'none' : 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </svg>

          <a
            href="#hero"
            onClick={(e) => {
              // Prevent standard navigation if user is holding
              if (holdProgress > 0.05) e.preventDefault()
            }}
            className="cursor-hover group font-display text-sm tracking-[0.35em] text-cream uppercase transition-colors hover:text-gold z-10"
          >
            <span className="text-gold/80 group-hover:text-gold">Capture</span>
            <span className="mx-2 text-cream-muted/50">in</span>
            <span>Silences</span>
          </a>
        </div>

        <ul className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="cursor-hover relative font-body text-xs tracking-[0.2em] text-cream-muted uppercase transition-colors hover:text-cream"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-500 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="cursor-hover bg-charcoal/40 border border-white/10 rounded-full py-1.5 px-3 text-[9px] uppercase font-body text-cream-muted tracking-widest focus:outline-none hover:border-gold/40 hover:text-gold transition-all"
            aria-label="Change language"
          >
            <option value="en" className="bg-charcoal text-cream">EN</option>
            <option value="hi" className="bg-charcoal text-cream">हिन्दी</option>
            <option value="ja" className="bg-charcoal text-cream">日本語</option>
            <option value="fr" className="bg-charcoal text-cream">FR</option>
            <option value="es" className="bg-charcoal text-cream">ES</option>
          </select>

          <button
            type="button"
            onClick={onToggleMusic}
            className="cursor-hover hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-cream-muted transition-all hover:border-gold/40 hover:text-gold hover:shadow-[0_0_20px_rgba(201,169,98,0.2)]"
            aria-label={musicPlaying ? 'Pause ambient music' : 'Play ambient music'}
            title={musicPlaying ? 'Pause music' : 'Play ambient music'}
          >
            {musicPlaying ? (
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-2v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="cursor-hover h-9 w-9 items-center justify-center rounded-full border border-white/10 text-cream-muted transition-all hover:border-gold/40 hover:text-gold hover:shadow-[0_0_20px_rgba(201,169,98,0.2)] flex"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="cursor-hover md:hidden flex h-9 w-9 items-center justify-center text-cream"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      <motion.div
        initial={false}
        animate={{ height: menuOpen ? 'auto' : 0, opacity: menuOpen ? 1 : 0 }}
        className="overflow-hidden md:hidden glass-nav"
      >
        <ul className="flex flex-col gap-6 px-6 pb-8 pt-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-body text-sm tracking-[0.2em] text-cream-muted uppercase"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.header>
  )
}
