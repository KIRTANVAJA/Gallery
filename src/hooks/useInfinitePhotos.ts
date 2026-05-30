import { useCallback, useEffect, useState } from 'react'
import type { GalleryCategory, Photo } from '../types/photo'
import { getDynamicPhotos } from '../utils/localDB'

export interface SearchParams {
  q?: string
  mood?: string
  tag?: string
}

export function useInfinitePhotos(
  category: GalleryCategory,
  searchParams: SearchParams = {},
) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(
    (pageNum: number) => {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      getDynamicPhotos()
        .then((allPhotos) => {
          let list = allPhotos

          // 1. Category Filter
          if (category !== 'All') {
            list = list.filter((p) => p.category === category)
          }

          // 2. Query Search
          if (searchParams.q) {
            const qLower = searchParams.q.toLowerCase()
            list = list.filter(
              (p) =>
                p.title.toLowerCase().includes(qLower) ||
                (p.description && p.description.toLowerCase().includes(qLower)) ||
                p.location.toLowerCase().includes(qLower) ||
                p.camera.toLowerCase().includes(qLower) ||
                (p.tags && p.tags.some((t) => t.toLowerCase().includes(qLower))) ||
                (p.aiTags && p.aiTags.some((t) => t.toLowerCase().includes(qLower))),
            )
          }

          // 3. Mood Filter
          if (searchParams.mood) {
            const mLower = searchParams.mood.toLowerCase()
            list = list.filter(
              (p) =>
                (p.mood && p.mood.toLowerCase().includes(mLower)) ||
                (p.tags && p.tags.some((t) => t.toLowerCase().includes(mLower))) ||
                (p.aiTags && p.aiTags.some((t) => t.toLowerCase().includes(mLower))),
            )
          }

          // 4. Tag Filter
          if (searchParams.tag) {
            const tLower = searchParams.tag.toLowerCase()
            list = list.filter(
              (p) =>
                (p.tags && p.tags.some((t) => t.toLowerCase() === tLower)) ||
                (p.aiTags && p.aiTags.some((t) => t.toLowerCase() === tLower)),
            )
          }

          // Paginate locally
          const limit = 24
          const startIndex = 0
          const endIndex = pageNum * limit
          const paginatedPhotos = list.slice(startIndex, endIndex)
          const moreAvailable = list.length > endIndex

          setPhotos(paginatedPhotos)
          setHasMore(moreAvailable)
          setPage(pageNum)
        })
        .catch((err) => {
          console.error('[useInfinitePhotos] Error processing dynamic photos:', err)
        })
        .finally(() => {
          setLoading(false)
          setLoadingMore(false)
        })
    },
    [category, searchParams.q, searchParams.mood, searchParams.tag],
  )

  useEffect(() => {
    setPage(1)
    load(1)

    const handleUpdate = () => load(1)
    window.addEventListener('storage', handleUpdate)
    window.addEventListener('gallery_updated', handleUpdate)
    return () => {
      window.removeEventListener('storage', handleUpdate)
      window.removeEventListener('gallery_updated', handleUpdate)
    }
  }, [load])

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      load(page + 1)
    }
  }

  return { photos, loading, loadingMore, hasMore, loadMore, refresh: () => load(1) }
}

