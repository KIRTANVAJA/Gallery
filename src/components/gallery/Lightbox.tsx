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
  const [showDetails, setShowDetails] = useState(false)
  const [direction, setDirection] = useState(0) // -1 for prev, 1 for next

  const goPrev = useCallback(() => {
    setDirection(-1)
    onNavigate(currentIndex === 0 ? images.length - 1 : currentIndex - 1)
  }, [currentIndex, images.length, onNavigate])

  const goNext = useCallback(() => {
    setDirection(1)
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
      if (img?.displayUrl || img?.src) {
        const preload = new Image()
        preload.src = img.displayUrl || img.src
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
  };

  const handleFavorite = () => {
    if (!image) return
    const fav = toggleLocalFavorite(image.id)
    setFavorited(fav)
  }

  if (!image) return null

  const displaySrc = image.displayUrl || image.previewUrl || image.src

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100vw' : dir < 0 ? '-100vw' : 0,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100vw' : dir > 0 ? '-100vw' : 0,
      opacity: 0,
      scale: 0.95
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex flex-col justify-between bg-black overflow-hidden select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Image viewer: ${image.title}`}
      >
        {/* Dynamic ambient backdrop glow */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <img
            src={displaySrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-110 opacity-20 filter blur-3xl saturate-150 contrast-125"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Top Header Bar */}
        <div className="relative z-10 w-full px-4 md:px-8 py-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 font-body text-[10px] tracking-widest uppercase text-cream-muted hover:text-gold transition-all"
            aria-label="Close image viewer"
          >
            <span>← Close</span>
          </button>
          
          <span className="font-body text-xs tracking-widest text-cream-muted hidden sm:inline-block">
            {currentIndex + 1} / {images.length} {slideshow && '• Autoplay'}
          </span>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSlideshow((s) => !s)}
              className={`font-body text-[10px] tracking-widest uppercase border px-3 py-1.5 transition-all ${
                slideshow
                  ? 'border-gold text-gold bg-gold/5'
                  : 'border-white/10 text-cream-muted hover:text-gold hover:border-gold/30'
              }`}
            >
              {slideshow ? 'Pause' : 'Slideshow'}
            </button>
            <button
              type="button"
              onClick={handleFavorite}
              className={`font-body text-[10px] tracking-widest uppercase border px-3 py-1.5 transition-all ${
                favorited ? 'border-gold text-gold bg-gold/5' : 'border-white/10 text-cream-muted hover:text-gold hover:border-gold/30'
              }`}
            >
              {favorited ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Main Viewport Container */}
        <div className="relative flex-1 flex items-center justify-center w-full max-w-6xl mx-auto px-4">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={image.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                const swipeThreshold = 50
                const swipeVelocity = 500
                if (info.offset.x < -swipeThreshold || info.velocity.x < -swipeVelocity) {
                  goNext()
                } else if (info.offset.x > swipeThreshold || info.velocity.x > swipeVelocity) {
                  goPrev()
                }
              }}
              className="relative w-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-pan-y z-10 py-4"
            >
              <div className="relative max-h-[60vh] md:max-h-[70vh] max-w-full px-4 flex items-center justify-center select-none pointer-events-none">
                <img
                  src={displaySrc}
                  alt={image.alt}
                  draggable={false}
                  className="max-h-[60vh] md:max-h-[70vh] w-auto max-w-full object-contain rounded-sm glow-gold shadow-2xl"
                />
                <ImageWatermark />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows (Hidden on mobile) */}
          <button
            type="button"
            onClick={goPrev}
            className="hidden md:flex cursor-hover absolute left-6 top-1/2 z-20 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-cream backdrop-blur-md hover:border-gold/60 hover:text-gold transition-all"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goNext}
            className="hidden md:flex cursor-hover absolute right-6 top-1/2 z-20 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-cream backdrop-blur-md hover:border-gold/60 hover:text-gold transition-all"
            aria-label="Next image"
          >
            ›
          </button>
        </div>

        {/* Minimal Bottom Bar */}
        <div className="relative z-10 w-full px-4 md:px-8 py-5 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between gap-4">
          <div className="text-left max-w-[55%]">
            <h3 className="font-heading text-base md:text-lg text-cream truncate">{image.title}</h3>
            <p className="font-body text-[10px] md:text-xs tracking-wider text-cream-muted truncate mt-0.5">{image.location}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              disabled={liked}
              className={`flex items-center justify-center gap-2 font-body text-[10px] tracking-widest uppercase border px-4 py-2 transition-all ${
                liked
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-white/10 text-cream-muted hover:text-gold hover:border-gold/30'
              }`}
            >
              <span>{liked ? 'Liked' : 'Like'}</span>
              <span className="opacity-80">({likes})</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="font-body text-[10px] tracking-widest uppercase border border-white/10 px-4 py-2 text-cream-muted hover:text-gold hover:border-gold/30 transition-all"
            >
              Details
            </button>
          </div>
        </div>

        {/* Collapsible Slide-up Details Drawer */}
        <AnimatePresence>
          {showDetails && (
            <>
              {/* Drawer Backdrop overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-[210] backdrop-blur-sm"
                onClick={() => setShowDetails(false)}
              />
              
              {/* Slide-up panel */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed bottom-0 left-0 right-0 max-h-[80vh] md:max-h-[70vh] bg-charcoal/95 border-t border-white/10 rounded-t-2xl z-[220] overflow-y-auto"
              >
                <div className="sticky top-0 bg-charcoal-mid/90 backdrop-blur-md px-6 py-4 border-b border-white/5 flex items-center justify-between z-10">
                  <div className="text-left">
                    <h3 className="font-heading text-lg md:text-xl text-cream">{image.title}</h3>
                    <p className="font-body text-xs text-cream-muted mt-0.5">{image.location}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetails(false)}
                    className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center text-cream hover:border-gold hover:text-gold transition-all text-xl"
                    aria-label="Close details"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  <div>
                    {/* Story / Description */}
                    {image.description && (
                      <div className="mb-6">
                        <h4 className="font-heading text-xs tracking-widest uppercase text-gold/80 mb-2">The Story</h4>
                        <p className="font-body text-sm text-cream-muted leading-relaxed">{image.description}</p>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="mb-6 flex flex-wrap gap-4 font-body text-xs text-cream-muted uppercase tracking-wider">
                      <span>{image.category}</span>
                      <span className="text-gold/40">·</span>
                      <span>{image.date}</span>
                      <span className="text-gold/40">·</span>
                      <span>{likes} likes</span>
                      <span className="text-gold/40">·</span>
                      <span>{image.views + 1} views</span>
                    </div>

                    {/* AI Tags */}
                    {image.aiTags && image.aiTags.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-heading text-xs tracking-widest uppercase text-gold/80 mb-2">Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {image.aiTags.map((tag) => (
                            <span
                              key={tag}
                              className="font-body text-[10px] px-2.5 py-1 border border-white/5 bg-white/5 text-cream-muted rounded-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EXIF Data */}
                    <div>
                      <h4 className="font-heading text-xs tracking-widest uppercase text-gold/80 mb-3">Camera & Settings</h4>
                      <ExifPanel exif={image.exif} camera={image.camera} lens={image.lens} />
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
                    <h4 className="font-heading text-xs tracking-widest uppercase text-gold/80 mb-4">Guestbook Comments</h4>
                    <PhotoComments photoId={image.id} />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
