import { useState, useEffect, useRef } from 'react'

interface Photo3D {
  _id: string
  title: string
  src: string
  alt: string
  category: string
  slug: string
}

interface Gallery3DProps {
  photos: Photo3D[]
  onSelectPhoto: (photo: Photo3D) => void
}

export function Gallery3D({ photos, onSelectPhoto }: Gallery3DProps) {
  const [rotationY, setRotationY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef(0)
  const rotationStartRef = useRef(0)

  // Use up to 10 photos to keep the 3D ring clean
  const displayPhotos = photos.slice(0, 10)
  const count = displayPhotos.length
  const radius = Math.max(280, count * 35) // Dynamic radius based on photo count

  const handleStart = (clientX: number) => {
    setIsDragging(true)
    dragStartRef.current = clientX
    rotationStartRef.current = rotationY
  }

  const handleMove = (clientX: number) => {
    if (!isDragging) return
    const diff = clientX - dragStartRef.current
    // 1px of drag corresponds to 0.4 degrees of rotation
    setRotationY(rotationStartRef.current + diff * 0.4)
  }

  const handleEnd = () => {
    setIsDragging(false)
  }

  // Auto-rotate slowly when idle
  useEffect(() => {
    if (isDragging) return
    const interval = setInterval(() => {
      setRotationY((r) => r - 0.15)
    }, 30)
    return () => clearInterval(interval)
  }, [isDragging])

  if (count === 0) {
    return (
      <div className="h-[450px] flex items-center justify-center border border-white/5 bg-black/20">
        <p className="text-cream-muted text-xs tracking-widest uppercase">No photographs available in visual vault.</p>
      </div>
    )
  }

  return (
    <div
      tabIndex={0}
      className="relative w-full h-[550px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-transparent via-gold/5 to-transparent select-none cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/30"
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setRotationY((r) => r + 15)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          setRotationY((r) => r - 15)
        }
      }}
      style={{
        perspective: '1200px',
      }}
    >
      {/* 3D Ring Container */}
      <div
        className="relative w-[200px] h-[280px]"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(-6deg) rotateY(${rotationY}deg)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {displayPhotos.map((photo, i) => {
          const angle = (i * 360) / count
          return (
            <div
              key={photo._id}
              role="button"
              tabIndex={0}
              aria-label={`Examine ${photo.title}`}
              className="absolute inset-0 border border-white/10 p-2 bg-charcoal-light/40 backdrop-blur-md rounded-sm overflow-hidden shadow-2xl transition-all duration-300 hover:border-gold/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus:border-gold/60 group cursor-pointer"
              onClick={() => onSelectPhoto(photo)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectPhoto(photo)
                }
              }}
              style={{
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {/* Overlay shadow for depth */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />

              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover rounded-sm pointer-events-none group-hover:scale-105 transition-transform duration-700"
                draggable="false"
              />

              {/* Title tag on hover */}
              <div className="absolute bottom-4 left-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-sm p-2 rounded-sm border border-white/5 text-center">
                <span className="font-display text-[10px] tracking-widest text-gold uppercase block">{photo.title}</span>
                <span className="font-body text-[8px] text-cream-muted uppercase tracking-wider block mt-0.5">{photo.category}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Instructions */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
        <span className="font-body text-[10px] tracking-[0.4em] text-cream-muted uppercase block mb-1 animate-pulse">
          Drag horizontally to rotate exhibition
        </span>
        <span className="font-body text-[9px] tracking-widest text-gold/60 uppercase block">
          Click frame to examine close details
        </span>
      </div>
    </div>
  )
}
