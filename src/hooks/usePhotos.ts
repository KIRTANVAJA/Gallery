import { useEffect, useState } from 'react'
import type { GalleryCategory, Photo } from '../types/photo'
import { getDynamicPhotos } from '../utils/localDB'

export function usePhotos(category: GalleryCategory = 'All') {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const mapped = await getDynamicPhotos()
        if (active) {
          if (category === 'All') {
            setPhotos(mapped)
          } else {
            setPhotos(mapped.filter((p) => p.category === category))
          }
        }
      } catch (err) {
        console.error('Failed to load photos:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    window.addEventListener('gallery_updated', load)
    return () => {
      active = false
      window.removeEventListener('gallery_updated', load)
    }
  }, [category])

  return { photos, loading, error: null, refetch: () => {} }
}

