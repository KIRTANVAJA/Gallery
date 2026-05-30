import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { getLocalPhotos } from '../../utils/localDB'
import type { SearchParams } from '../../hooks/useInfinitePhotos'


interface GallerySearchProps {
  onSearch: (params: SearchParams) => void
}

export function GallerySearch({ onSearch }: GallerySearchProps) {
  const [q, setQ] = useState('')
  const [mood, setMood] = useState('')
  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; slug: string; title: string; category: string }>
  >([])

  useEffect(() => {
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    const t = setTimeout(() => {
      try {
        const local = getLocalPhotos()
        const matched = local
          .filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 5)
          .map((p) => ({
            id: p.id,
            slug: p.slug || p.id,
            title: p.title,
            category: p.category,
          }))
        setSuggestions(matched)
      } catch {
        setSuggestions([])
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  const apply = (query = q, moodFilter = mood) => {
    onSearch({
      q: query || undefined,
      mood: moodFilter || undefined,
    })
  }

  return (
    <div className="max-w-2xl mx-auto mb-12">
      <div className="relative">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder="Search — moody night portraits, golden sunset..."
          className="w-full bg-transparent border-b border-white/15 py-4 font-body text-sm text-cream placeholder:text-cream-muted/50 focus:border-gold/50 focus:outline-none"
          aria-label="Search photos"
        />
        <button
          type="button"
          onClick={() => apply()}
          className="absolute right-0 top-1/2 -translate-y-1/2 font-body text-xs tracking-widest text-gold uppercase"
        >
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {['moody', 'cinematic', 'golden', 'intimate', 'ethereal'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMood(m)
              apply(q, m)
            }}
            className={`px-3 py-1 text-[10px] tracking-wider uppercase border rounded-full transition-colors ${
              mood === m
                ? 'border-gold/50 text-gold'
                : 'border-white/10 text-cream-muted hover:border-gold/30'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 border border-white/10 bg-charcoal-light/90 backdrop-blur-xl"
          >
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setQ(s.title)
                    apply(s.title)
                    setSuggestions([])
                  }}
                  className="w-full text-left px-4 py-3 font-body text-sm text-cream-muted hover:text-cream hover:bg-white/5"
                >
                  {s.title}
                  <span className="ml-2 text-xs text-gold/60">{s.category}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
