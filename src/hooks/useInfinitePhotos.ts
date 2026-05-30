import { useCallback, useEffect, useState } from 'react'
import type { GalleryCategory, Photo } from '../types/photo'
import galleryData from '../data/gallery.json'

export interface SearchParams {
  q?: string
  mood?: string
  tag?: string
}

export function useInfinitePhotos(
  category: GalleryCategory,
  searchParams: SearchParams = {},
) {
  const [allPhotos, setAllPhotos] = useState<Photo[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // 1. Load Photos from local gallery.json
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
    setAllPhotos(mapped)
    setLoading(false)
  }, [galleryData])

  // 2. Perform Filtering & Pagination when dataset or criteria changes
  const applyFiltersAndPaginate = useCallback(
    (pageNum: number) => {
      if (pageNum > 1) {
        setLoadingMore(true)
      }

      let list = allPhotos

      // Category Filter
      if (category !== 'All') {
        list = list.filter((p) => p.category === category)
      }

      // Query Search
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

      // Mood Filter
      if (searchParams.mood) {
        const mLower = searchParams.mood.toLowerCase()
        list = list.filter(
          (p) =>
            (p.mood && p.mood.toLowerCase().includes(mLower)) ||
            (p.tags && p.tags.some((t) => t.toLowerCase().includes(mLower))) ||
            (p.aiTags && p.aiTags.some((t) => t.toLowerCase().includes(mLower))),
        )
      }

      // Tag Filter
      if (searchParams.tag) {
        const tLower = searchParams.tag.toLowerCase()
        list = list.filter(
          (p) =>
            (p.tags && p.tags.some((t) => t.toLowerCase() === tLower)) ||
            (p.aiTags && p.aiTags.some((t) => t.toLowerCase() === tLower)),
        )
      }

      const limit = 24
      const endIndex = pageNum * limit
      const paginated = list.slice(0, endIndex)
      const moreAvailable = list.length > endIndex

      setPhotos(paginated)
      setHasMore(moreAvailable)
      setPage(pageNum)
      setLoadingMore(false)
    },
    [allPhotos, category, searchParams.q, searchParams.mood, searchParams.tag],
  )

  useEffect(() => {
    setPage(1)
    applyFiltersAndPaginate(1)
  }, [applyFiltersAndPaginate])

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      applyFiltersAndPaginate(page + 1)
    }
  }

  return { photos, loading, loadingMore, hasMore, loadMore, refresh: () => applyFiltersAndPaginate(1) }
}
