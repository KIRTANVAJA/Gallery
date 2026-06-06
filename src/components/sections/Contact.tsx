import { motion } from 'framer-motion'
import { FormEvent, useEffect, useState } from 'react'
import { getLocalSettings } from '../../utils/localDB'
import { subscribeSettings, dbAddInquiry } from '../../utils/localDB'


const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: 'Behance',
    href: 'https://behance.net',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-2.729-5.564-5.71 0-3.275 2.16-5.71 5.328-5.71 3.018 0 4.846 1.805 5.375 4.276h-3.187c-.094-1.018-.658-2.08-2.188-2.08-1.873 0-2.36 1.805-2.36 3.275 0 3.018 1.436 3.275 2.663 3.275 1.297 0 1.91-.658 2.188-1.55h-2.663v-2.36h5.564c.094.565.188 1.178.188 1.805zm-12.726-10h-8v14h8c4.42 0 6.5-2.729 6.5-7 0-4.271-2.08-7-6.5-7zm-2 10h-2v-6h2c2.08 0 3 1.178 3 3s-.92 3-3 3zm2-8h-2v-2h2c1.55 0 2.5.658 2.5 2s-.95 2-2.5 2z" />
      </svg>
    ),
  },
  {
    name: 'Vimeo',
    href: 'https://vimeo.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.601-1.302-3.573-3.906l-1.953-7.422c-.729-2.695-1.512-4.043-2.349-4.043-.18 0-.806.378-1.88 1.132L0 7.265c1.185-1.039 2.351-2.077 3.499-3.115 1.581-1.362 2.767-2.082 3.562-2.16 1.87-.18 3.024 1.1 3.461 3.838.466 2.953.789 4.789.969 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.538-2.797 1.591-3.622.108-1.4-.403-2.102-1.532-2.102-.544 0-1.101.124-1.671.372 1.107-3.617 3.223-5.373 6.349-5.27 2.318.069 3.411 1.565 3.275 4.488z" />
      </svg>
    ),
  },
  {
    name: 'Vero',
    href: 'https://vero.co',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2.5 6.5l-3.8 6.3c-.15.25-.43.4-.7.4s-.55-.15-.7-.4L7.5 9.5c-.2-.3-.05-.75.3-.75h7.4c.35 0 .5.45.3.75z" />
      </svg>
    ),
  },
]

export function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [inquiryType, setInquiryType] = useState('general')
  const [newsletterDone, setNewsletterDone] = useState(false)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(() => getLocalSettings())

  useEffect(() => {
    const unsubscribe = subscribeSettings((latestSettings) => {
      setSettings(latestSettings)
    })
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)
    try {
      await dbAddInquiry(
        String(data.get('name')),
        String(data.get('email')),
        String(data.get('message')),
        inquiryType,
      )
      setSubmitted(true)
      form.reset()
      setTimeout(() => {
        setSubmitted(false)
      }, 4000)
    } catch {
      setError('Unable to send. Please try again.')
    }
  }

  const handleNewsletter = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = new FormData(e.currentTarget).get('newsletter') as string
    try {
      const current = JSON.parse(localStorage.getItem('gallery_newsletter') || '[]')
      if (!current.includes(email)) {
        current.push(email)
        localStorage.setItem('gallery_newsletter', JSON.stringify(current))
      }
      setNewsletterDone(true)
    } catch {
      setError('Subscription failed')
    }
  }

  return (
    <section id="contact" className="relative section-padding bg-[var(--bg-primary)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,98,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <p className="font-body text-xs tracking-[0.4em] text-gold uppercase mb-4">
            Connect
          </p>
          <h2 className="font-display text-3xl md:text-5xl tracking-wide text-cream">
            Start a Conversation
          </h2>
          <p className="font-heading text-lg text-cream-muted italic mt-6">
            For commissions, collaborations, or quiet hellos.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <a
            href={settings.instagramUrl || 'https://instagram.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-hover flex items-center gap-3 rounded-full border border-gold/30 bg-gold/5 px-8 py-4 font-body text-xs tracking-[0.2em] text-gold uppercase transition-all duration-500 hover:bg-gold/15 hover:shadow-[0_0_40px_rgba(201,169,98,0.2)]"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            Follow on Instagram
          </a>
          <a
            href={`mailto:${settings.contactEmail}`}
            className="cursor-hover font-body text-sm text-cream-muted transition-colors hover:text-gold"
          >
            {settings.contactEmail}
          </a>
        </div>

        <div className="flex justify-center gap-4 mb-14">
          <a
            href={settings.instagramUrl || 'https://instagram.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-hover flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-cream-muted transition-all duration-500 hover:border-gold/50 hover:text-gold hover:shadow-[0_0_30px_rgba(201,169,98,0.25)]"
            aria-label="Instagram"
          >
            {socialLinks.find(s => s.name === 'Instagram')?.icon}
          </a>
          <a
            href={settings.veroUrl || 'https://vero.co'}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-hover flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-cream-muted transition-all duration-500 hover:border-gold/50 hover:text-gold hover:shadow-[0_0_30px_rgba(201,169,98,0.25)]"
            aria-label="Vero"
          >
            {socialLinks.find(s => s.name === 'Vero')?.icon}
          </a>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="space-y-6 max-w-xl mx-auto"
        >
          <label className="block">
            <span className="font-body text-xs tracking-widest text-cream-muted uppercase mb-2 block">
              Inquiry Type
            </span>
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              className="w-full bg-charcoal border border-white/10 py-3 px-3 font-body text-sm text-cream"
            >
              <option value="general">General</option>
              <option value="booking">Booking</option>
              <option value="collaboration">Collaboration</option>
              <option value="print">Print</option>
            </select>
          </label>
          {error && <p className="text-red-400/80 text-sm">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <label className="block">
              <span className="font-body text-xs tracking-widest text-cream-muted uppercase mb-2 block">
                Name
              </span>
              <input
                type="text"
                name="name"
                required
                className="w-full bg-transparent border-b border-white/10 py-3 font-body text-sm text-cream placeholder:text-cream-muted/40 focus:border-gold/50 focus:outline-none transition-colors"
                placeholder="Your name"
              />
            </label>
            <label className="block">
              <span className="font-body text-xs tracking-widest text-cream-muted uppercase mb-2 block">
                Email
              </span>
              <input
                type="email"
                name="email"
                required
                className="w-full bg-transparent border-b border-white/10 py-3 font-body text-sm text-cream placeholder:text-cream-muted/40 focus:border-gold/50 focus:outline-none transition-colors"
                placeholder="your@email.com"
              />
            </label>
          </div>
          <label className="block">
            <span className="font-body text-xs tracking-widest text-cream-muted uppercase mb-2 block">
              Message
            </span>
            <textarea
              name="message"
              required
              rows={4}
              className="w-full bg-transparent border-b border-white/10 py-3 font-body text-sm text-cream placeholder:text-cream-muted/40 focus:border-gold/50 focus:outline-none transition-colors resize-none"
              placeholder="Tell me about your vision..."
            />
          </label>
          <button
            type="submit"
            className="cursor-hover w-full sm:w-auto font-body text-xs tracking-[0.3em] text-charcoal uppercase bg-gold px-12 py-4 transition-all duration-500 hover:bg-gold-soft hover:shadow-[0_0_40px_rgba(201,169,98,0.3)]"
          >
            {submitted ? 'Message Sent' : 'Send Message'}
          </button>
        </motion.form>

        <motion.form
          onSubmit={handleNewsletter}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
        >
          <input
            type="email"
            name="newsletter"
            required
            placeholder="Newsletter email"
            className="flex-1 bg-transparent border-b border-white/10 py-3 text-sm text-cream focus:outline-none focus:border-gold/50"
          />
          <button
            type="submit"
            className="font-body text-xs tracking-widest uppercase text-gold border border-gold/30 px-6 py-3 hover:bg-gold/10"
          >
            {newsletterDone ? 'Subscribed' : 'Subscribe'}
          </button>
        </motion.form>
      </div>
    </section>
  )
}
