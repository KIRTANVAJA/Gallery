import { motion } from 'framer-motion'
import { CATEGORIES, type GalleryCategory } from '../../types/photo'

interface GalleryFilterProps {
  active: GalleryCategory
  onChange: (category: GalleryCategory) => void
}

export function GalleryFilter({ active, onChange }: GalleryFilterProps) {
  return (
    <div
      className="flex flex-wrap justify-center gap-2 md:gap-3 mb-14"
      role="tablist"
      aria-label="Filter gallery by category"
    >
      {CATEGORIES.map((category) => {
        const isActive = active === category
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(category)}
            className={`cursor-hover relative px-4 py-2 font-body text-xs tracking-[0.15em] uppercase transition-colors duration-500 rounded-full border ${
              isActive
                ? 'border-gold/50 text-gold'
                : 'border-white/10 text-cream-muted hover:border-gold/30 hover:text-cream'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="filter-pill"
                className="absolute inset-0 rounded-full bg-gold/10"
                style={{ boxShadow: '0 0 20px rgba(201, 169, 98, 0.15)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{category}</span>
          </button>
        )
      })}
    </div>
  )
}
