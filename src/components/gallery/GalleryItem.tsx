import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ImageWatermark } from '../effects/ImageWatermark'
import { useLazyImage } from '../../hooks/useLazyImage'
import type { Photo } from '../../types/photo'

interface GalleryItemProps {
  image: Photo
  index: number
  onClick: () => void
}

export const GalleryItem = React.memo(
  function GalleryItem({ image, index, onClick }: GalleryItemProps) {
    const thumbSrc = image.previewUrl || image.src
    const { ref, loaded } = useLazyImage(thumbSrc)
    
    // Set fallback aspect ratios to prevent layout shifts while loading
    const [aspectRatio, setAspectRatio] = useState<number>(() => {
      if (image.aspect === 'tall') return 2 / 3
      if (image.aspect === 'wide') return 3 / 2
      return 1
    })

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget
      if (naturalWidth && naturalHeight) {
        setAspectRatio(naturalWidth / naturalHeight)
      }
    }

    return (
      <motion.article
        layout
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: 0.6,
          delay: index * 0.05,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="masonry-item group cursor-hover"
      >
        <div ref={ref}>
          <button
            type="button"
            onClick={onClick}
            className="protected-image relative w-full overflow-hidden rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            aria-label={`View ${image.title}`}
          >
            <div
              className="relative w-full overflow-hidden bg-charcoal-mid transition-all duration-300"
              style={{ aspectRatio }}
            >
              {!loaded && (
                <div className="absolute inset-0 animate-pulse bg-charcoal-mid" />
              )}
              <motion.img
                src={loaded ? thumbSrc : undefined}
                alt={image.alt}
                loading="lazy"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                onLoad={handleImageLoad}
                className={`h-full w-full object-cover transition-all duration-700 ease-cinematic group-hover:scale-105 select-none ${
                  loaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <ImageWatermark />
              
              {/* Desktop-only hover overlay detail */}
              <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-85" />
              <div className="hidden md:flex absolute inset-0 flex flex-col justify-end p-5 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="font-heading text-xl text-cream">{image.title}</p>
                <p className="font-body text-xs tracking-wider text-cream-muted mt-1">
                  {image.location}
                </p>
                <div className="flex gap-4 mt-2 font-body text-[10px] tracking-wider text-cream-muted/80">
                  <span>{image.views} views</span>
                  <span>{image.likes} likes</span>
                </div>
              </div>
            </div>
          </button>
          
          {/* Mobile caption footer (visible only under md breakpoint) */}
          <div className="mt-2 px-1 pb-3 md:hidden text-left">
            <h3 className="font-heading text-[13px] tracking-wide text-cream line-clamp-1">
              {image.title}
            </h3>
            <div className="flex items-center justify-between mt-0.5 font-body text-[10px] text-cream-muted/80">
              <span className="line-clamp-1">{image.location || 'Untitled Location'}</span>
              <span className="shrink-0">{image.likes} likes</span>
            </div>
          </div>
        </div>
      </motion.article>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.index === nextProps.index &&
      prevProps.image.id === nextProps.image.id &&
      prevProps.image.src === nextProps.image.src &&
      prevProps.image.previewUrl === nextProps.image.previewUrl &&
      prevProps.image.likes === nextProps.image.likes &&
      prevProps.image.views === nextProps.image.views &&
      prevProps.image.title === nextProps.image.title
    )
  }
)
