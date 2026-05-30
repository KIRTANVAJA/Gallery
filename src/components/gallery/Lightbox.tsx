import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { incrementPhotoLike, incrementPhotoView, toggleLocalFavorite, getLocalFavoriteStatus } from '../../utils/localDB'

import type { Photo } from '../../types/photo'
import { ImageWatermark } from '../effects/ImageWatermark'
import { ExifPanel } from './ExifPanel'
import { PhotoComments } from './PhotoComments'

interface LightboxProps {
  images: Photo[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function Lightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const image = images[currentIndex]
  const [likes, setLikes] = useState(image?.likes ?? 0)
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [slideshow, setSlideshow] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const goPrev = useCallback(() => {
    onNavigate(currentIndex === 0 ? images.length - 1 : currentIndex - 1)
  }, [currentIndex, images.length, onNavigate])

  const goNext = useCallback(() => {
    onNavigate(currentIndex === images.length - 1 ? 0 : currentIndex + 1)
  }, [currentIndex, images.length, onNavigate])

  useEffect(() => {
    if (!image) return
    setLikes(image.likes)
    setLiked(false)
    setFavorited(getLocalFavoriteStatus(image.id))
    incrementPhotoView(image.id)

    // Notify other components of gallery update (e.g. view count change)
    window.dispatchEvent(new Event('gallery_updated'))

    const next = images[currentIndex + 1]
    const prev = images[currentIndex - 1]
    ;[next, prev].forEach((img) => {
      if (img?.displayUrl) {
        const preload = new Image()
        preload.src = img.displayUrl
      }
    })
  }, [image, currentIndex, images])

  useEffect(() => {
    if (!slideshow) return
    const timer = setInterval(goNext, 5000)
    return () => clearInterval(timer)
  }, [slideshow, goNext])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === ' ') {
        e.preventDefault()
        setSlideshow((s) => !s)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, goPrev, goNext])

  const handleLike = () => {
    if (!image || liked) return
    const newLikes = incrementPhotoLike(image.id)
    setLikes(newLikes)
    setLiked(true)
    window.dispatchEvent(new Event('gallery_updated'))
  }

  const handleFavorite = () => {
    if (!image) return
    const fav = toggleLocalFavorite(image.id)
    setFavorited(fav)
  }

  if (!image) return null

  const displaySrc = image.displayUrl || image.previewUrl || image.src

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Image viewer: ${image.title}`}
      >
        <motion.button
          type="button"
          className="absolute inset-0 bg-charcoal/95 backdrop-blur-2xl cursor-pointer"
          onClick={onClose}
          aria-label="Close viewer"
        />

        <motion.div
          className="relative z-10 flex max-h-[95vh] w-full max-w-6xl flex-col px-4 md:px-8 overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0, filter: 'blur(12px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait">
            <motion.div key={image.id} className="relative protected-image">
              <motion.img
                src={displaySrc}
                alt={image.alt}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="max-h-[60vh] w-full object-contain rounded-sm glow-gold select-none mx-auto"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5 }}
              />
              <ImageWatermark />
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-end">
            <button
              type="button"
              onClick={() => setSlideshow((s) => !s)}
              className="font-body text-[10px] tracking-widest uppercase border border-white/10 px-4 py-2 text-cream-muted hover:text-gold hover:border-gold/30"
            >
              {slideshow ? 'Pause' : 'Slideshow'}
            </button>
            <button
              type="button"
              onClick={handleFavorite}
              className={`font-body text-[10px] tracking-widest uppercase border px-4 py-2 ${
                favorited ? 'border-gold text-gold' : 'border-white/10 text-cream-muted'
              }`}
            >
              {favorited ? 'Saved' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowComments((s) => !s)}
              className="font-body text-[10px] tracking-widest uppercase border border-white/10 px-4 py-2 text-cream-muted hover:text-gold"
            >
              Comments ({image.commentCount || 0})
            </button>
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h3 className="font-heading text-2xl md:text-3xl text-cream">{image.title}</h3>
              {image.mood && (
                <span className="inline-block mt-2 font-body text-[10px] tracking-widest uppercase text-gold/70">
                  {image.mood}
                </span>
              )}
              <div className="mt-4 flex flex-wrap gap-4 font-body text-xs tracking-wider text-cream-muted uppercase">
                {image.location && <span>{image.location}</span>}
                {image.camera && (
                  <>
                    <span className="text-gold/40">·</span>
                    <span>{image.camera}</span>
                  </>
                )}
                {image.date && (
                  <>
                    <span className="text-gold/40">·</span>
                    <span>{image.date}</span>
                  </>
                )}
              </div>
              {image.aiTags && image.aiTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {image.aiTags.slice(0, 6).map((tag) => (
                    <span
                      key={tag}
                      className="font-body text-[10px] px-2 py-1 border border-white/10 text-cream-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 font-body text-xs text-cream-muted">
                {image.views + 1} views · {likes} likes
              </p>
              <ExifPanel exif={image.exif} camera={image.camera} lens={image.lens} />
            </div>

            <button
              type="button"
              onClick={handleLike}
              disabled={liked}
              className="cursor-hover self-start font-body text-xs tracking-[0.2em] uppercase border border-gold/30 px-6 py-3 text-gold hover:bg-gold/10 disabled:opacity-50"
            >
              {liked ? 'Appreciated' : 'Appreciate'}
            </button>
          </div>

          {showComments && <PhotoComments photoId={image.id} />}
        </motion.div>

        <button
          type="button"
          onClick={onClose}
          className="cursor-hover absolute top-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-cream hover:border-gold/50 hover:text-gold"
          aria-label="Close"
        >
          ×
        </button>

        <button type="button" onClick={goPrev} className="cursor-hover absolute left-4 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded-full border border-white/10 text-cream hover:border-gold/50" aria-label="Previous">‹</button>
        <button type="button" onClick={goNext} className="cursor-hover absolute right-4 top-1/2 z-20 -translate-y-1/2 h-12 w-12 rounded-full border border-white/10 text-cream hover:border-gold/50" aria-label="Next">›</button>

        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-body text-xs tracking-widest text-cream-muted">
          {currentIndex + 1} / {images.length}
          {slideshow && ' · autoplay'}
        </p>
      </motion.div>
    </AnimatePresence>
  )
}
