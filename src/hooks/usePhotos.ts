import { useEffect, useState } from 'react'
import type { GalleryCategory, Photo } from '../types/photo'
import galleryData from '../data/gallery.json'

export function usePhotos(category: GalleryCategory = 'All') {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const mapped: Photo[] = (galleryData as any[]).map((item) => ({
      id: String(item.id),
      title: item.title,
      category: item.category,
      src: item.image,
      displayUrl: item.image,
      previewUrl: item.image,
      aspect: item.aspect || 'wide',
      location: item.location || '',
      camera: item.camera || '',
      date: item.date || '',
      featured: !!item.featured,
      likes: Number(item.likes) || 0,
      views: Number(item.views) || 0,
      commentCount: Number(item.commentCount) || 0,
      description: item.description || '',
      alt: item.title,
    }))

    if (category === 'All') {
      setPhotos(mapped)
    } else {
      setPhotos(mapped.filter((p) => p.category === category))
    }
    setLoading(false)
  }, [category, galleryData])

  return { photos, loading, error: null, refetch: () => {} }
}

