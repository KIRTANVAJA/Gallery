import { useCallback, useEffect, useState } from 'react'
import type { GalleryCategory, Photo } from '../types/photo'
import { getDynamicPhotos } from '../utils/localDB'

export function usePhotos(category: GalleryCategory = 'All') {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getDynamicPhotos()
      .then((allPhotos) => {
        if (category === 'All') {
          setPhotos(allPhotos)
        } else {
          setPhotos(allPhotos.filter((p) => p.category === category))
        }
      })
      .catch((err: any) => {
        setError(err?.message || 'Gallery offline')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [category])

  useEffect(() => {
    load()
    const handleUpdate = () => load()
    window.addEventListener('storage', handleUpdate)
    window.addEventListener('gallery_updated', handleUpdate)
    return () => {
      window.removeEventListener('storage', handleUpdate)
      window.removeEventListener('gallery_updated', handleUpdate)
    }
  }, [load])

  return { photos, loading, error, refetch: load }
}

