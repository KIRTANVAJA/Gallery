import { useState, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface AdminLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const navigate = useNavigate()
  const [passkey, setPasskey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    console.log('[Auth Init] Attempting local login with passkey...')
    
    // Read passcode from settings, fallback to '1984'
    const settingsStr = localStorage.getItem('gallery_settings')
    let correctPasscode = '1984'
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr)
        correctPasscode = settings.passcode || '1984'
      } catch {
        // Fallback
      }
    }

    setTimeout(() => {
      if (passkey === correctPasscode) {
        console.log('[Auth Success] Passcode validation succeeded!')
        localStorage.setItem('is_admin', 'true')
        setLoading(false)
        onClose()
        console.log('[Redirect Triggered] Redirecting to /hidden-admin-dashboard...')
        navigate('/hidden-admin-dashboard')
      } else {
        console.error('[Auth Failure] Passcode mismatch.')
        setError('Access Denied. Signature mismatch.')
        setLoading(false)
      }
    }, 1200) // 1.2s delay for cinematic vibe
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden">
          {/* Dark Backdrop Overlay with dynamic blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm mx-4 p-8 md:p-10 border border-gold/20 bg-charcoal-light/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(201,169,98,0.15)] overflow-hidden z-10 rounded-sm"
          >
            {/* Inner Film Grain texture overlay for the modal itself */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.12] mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Warm Golden Glow Accent at the top */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-b from-gold/20 to-transparent blur-2xl pointer-events-none rounded-full" />

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-6 right-6 text-cream-muted/50 hover:text-gold transition-colors font-body text-xs tracking-widest uppercase cursor-hover"
              aria-label="Close modal"
            >
              Esc
            </button>

            {/* Cinematic Headings */}
            <div className="text-center mt-4">
              <span className="font-body text-[10px] tracking-[0.4em] text-gold uppercase block mb-2">
                Restricted Archive
              </span>
              <h2 className="font-display text-xl text-cream tracking-[0.2em] uppercase">
                Passcode Verification
              </h2>
              <p className="font-body text-xs text-cream-muted/60 mt-3 italic">
                "Entering Silent Control Room"
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6 relative z-10">
              <div className="space-y-2 text-center">
                <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase mb-1">
                  Enter Numeric Signature Key
                </label>
                <input
                  type="password"
                  required
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="w-full bg-charcoal/50 border border-white/15 py-3.5 px-4 text-center text-lg text-cream placeholder-cream-muted/10 tracking-[0.5em] focus:border-gold/45 focus:outline-none transition-all rounded-sm font-mono font-bold"
                  placeholder="••••"
                  autoFocus
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400/80 text-xs font-body tracking-wide text-center"
                >
                  {error}
                </motion.p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full font-body text-xs tracking-[0.25em] uppercase bg-gold text-charcoal py-4 hover:bg-gold-soft transition-all duration-300 disabled:opacity-50 font-bold overflow-hidden cursor-hover rounded-sm shadow-md hover:shadow-[0_0_20px_rgba(201,169,98,0.25)]"
                >
                  {loading ? 'Decrypting Key...' : 'Unlock Control Room'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
