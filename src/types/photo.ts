export type PhotoCategory =
  | 'Portraits'
  | 'Street'
  | 'Nature'
  | 'Monochrome'
  | 'Cinematic'
  | 'Travel'

export const PHOTO_CATEGORIES: PhotoCategory[] = [
  'Portraits',
  'Street',
  'Nature',
  'Monochrome',
  'Cinematic',
  'Travel',
]

export type GalleryCategory = 'All' | PhotoCategory

export interface PhotoExif {
  camera?: string
  lens?: string
  iso?: number
  shutterSpeed?: string
  aperture?: string
  focalLength?: string
  capturedAt?: string
  orientation?: string
}

export interface Photo {
  id: string
  _id?: string
  slug?: string
  title: string
  description?: string
  category: PhotoCategory
  tags?: string[]
  aiTags?: string[]
  mood?: string
  dominantColors?: string[]
  location: string
  camera: string
  lens?: string
  exif?: PhotoExif
  featured: boolean
  likes: number
  views: number
  commentCount?: number
  aspect: 'tall' | 'wide' | 'square'
  src: string
  previewUrl?: string
  displayUrl?: string
  alt: string
  date: string
  uploadedAt?: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
  hasMore: boolean
}

export const CATEGORIES: GalleryCategory[] = ['All', ...PHOTO_CATEGORIES]
