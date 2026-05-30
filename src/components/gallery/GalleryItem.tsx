import { motion } from 'framer-motion'
import { ImageWatermark } from '../effects/ImageWatermark'
import { useLazyImage } from '../../hooks/useLazyImage'
import type { Photo } from '../../types/photo'

interface GalleryItemProps {
  image: Photo
  index: number
  onClick: () => void
}

export function GalleryItem({ image, index, onClick }: GalleryItemProps) {
  const { ref, loaded } = useLazyImage(image.src)

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
            className={`relative overflow-hidden bg-charcoal-mid ${
              image.aspect === 'tall'
                ? 'aspect-[3/4]'
                : image.aspect === 'wide'
                  ? 'aspect-[4/3]'
                  : 'aspect-square'
            }`}
          >
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-charcoal-mid" />
            )}
            <motion.img
              src={loaded ? image.src : undefined}
              alt={image.alt}
              loading="lazy"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className={`h-full w-full object-cover transition-all duration-700 ease-cinematic group-hover:scale-110 select-none ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.7 }}
            />
            <ImageWatermark />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-80" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
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
      </div>
    </motion.article>
  )
}
