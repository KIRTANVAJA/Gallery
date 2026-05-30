import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLocalPhotos } from '../utils/localDB'
import { SeoHead } from '../components/seo/SeoHead'
import { Lightbox } from '../components/gallery/Lightbox'
import type { Photo } from '../types/photo'

export function PhotoPage() {
  const { slug } = useParams<{ slug: string }>()
  const [photo, setPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    if (!slug) return
    const all = getLocalPhotos()
    const found = all.find((p) => p.slug === slug || p.id === slug)
    setPhoto(found || null)
  }, [slug])

  if (!photo) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <p className="text-cream-muted font-body">Photograph not found.</p>
      </div>
    )
  }

  return (
    <>
      <SeoHead
        title={photo.title}
        description={photo.description || photo.alt}
        image={photo.displayUrl || photo.src}
        type="article"
      />
      <Link
        to="/#gallery"
        className="fixed top-6 left-6 z-[300] font-body text-xs tracking-widest text-gold uppercase"
      >
        ← Gallery
      </Link>
      <Lightbox
        images={[photo]}
        currentIndex={0}
        onClose={() => window.history.back()}
        onNavigate={() => {}}
      />
    </>
  )
}
