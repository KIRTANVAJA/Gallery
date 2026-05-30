import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useInfinitePhotos, type SearchParams } from '../../hooks/useInfinitePhotos'
import type { GalleryCategory } from '../../types/photo'
import { GalleryFilter } from './GalleryFilter'
import { GalleryItem } from './GalleryItem'
import { GallerySearch } from './GallerySearch'
import { Lightbox } from './Lightbox'
import { Gallery3D } from './Gallery3D'
import { useTranslation } from '../../hooks/useTranslation'

export function MasonryGrid() {
  const [category, setCategory] = useState<GalleryCategory>('All')
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [view3D, setView3D] = useState(false)
  const { t } = useTranslation()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { photos, loading, loadingMore, hasMore, loadMore } = useInfinitePhotos(
    category,
    searchParams,
  )

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore, hasMore])

  return (
    <>
      <GallerySearch
        onSearch={(params) => {
          setSearchParams(params)
        }}
      />

      <GalleryFilter active={category} onChange={setCategory} />

      <div className="flex justify-center mb-10">
        <button
          type="button"
          onClick={() => setView3D(!view3D)}
          className="cursor-hover border border-gold/30 hover:border-gold px-6 py-2.5 bg-gold/5 text-gold text-xs tracking-widest uppercase hover:shadow-[0_0_15px_rgba(201,169,98,0.15)] transition-all font-semibold rounded-full"
        >
          {view3D ? t('exit3d') : t('enter3d')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <motion.div
            className="h-px w-32 bg-gradient-to-r from-transparent via-gold to-transparent"
            animate={{ scaleX: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      ) : photos.length === 0 ? (
        <p className="text-center font-heading text-xl text-cream-muted italic py-24">
          No photographs match your search.
        </p>
      ) : view3D ? (
        <Gallery3D
          photos={photos.map((p) => ({
            _id: p.id,
            title: p.title,
            src: p.src,
            alt: p.alt || p.title,
            category: p.category,
            slug: p.slug || '',
          }))}
          onSelectPhoto={(p) => {
            const idx = photos.findIndex((item) => item.id === p._id)
            if (idx !== -1) setLightboxIndex(idx)
          }}
        />
      ) : (
        <>
          <div className="masonry-grid">
            <AnimatePresence mode="popLayout">
              {photos.map((image, index) => (
                <GalleryItem
                  key={image.id}
                  image={image}
                  index={index % 12}
                  onClick={() => setLightboxIndex(index)}
                />
              ))}
            </AnimatePresence>
          </div>
          <div ref={sentinelRef} className="h-20 flex items-center justify-center">
            {loadingMore && (
              <span className="font-body text-xs text-cream-muted tracking-widest">
                Loading more...
              </span>
            )}
          </div>
        </>
      )}

      {lightboxIndex !== null && photos.length > 0 && (
        <Lightbox
          images={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  )
}
