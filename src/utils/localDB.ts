import { galleryImages } from '../data/gallery'
import { defaultSettings, type SiteSettings } from '../data/settings'
import type { Photo, PhotoCategory } from '../types/photo'

export interface LocalComment {
  id: string
  photoId: string
  authorName: string
  content: string
  createdAt: string
  replies?: Array<{
    id: string
    authorName: string
    content: string
    createdAt: string
  }>
}

export interface LocalInquiry {
  _id: string
  name: string
  email: string
  type: string
  message: string
  status: string
  createdAt: string
}

export interface CloudinaryConfig {
  cloudName: string
  uploadPreset: string
  apiKey: string
  apiSecret: string
}

// --- CLOUDINARY CONFIG & HELPERS ---
export function getCloudinaryConfig(): CloudinaryConfig | null {
  const local = localStorage.getItem('cloudinary_config')
  if (local) {
    try {
      const parsed = JSON.parse(local)
      if (parsed.cloudName && parsed.uploadPreset) {
        return parsed
      }
    } catch {
      return null
    }
  }
  return null
}

export function saveCloudinaryConfig(config: CloudinaryConfig) {
  localStorage.setItem('cloudinary_config', JSON.stringify(config))
}

export function serializeMetadata(photo: {
  title: string
  category: string
  camera: string
  location: string
  date: string
  aspect: 'tall' | 'wide' | 'square'
  featured: boolean
  description?: string
}): string {
  const params = new URLSearchParams()
  params.set('t', photo.title)
  params.set('c', photo.category)
  if (photo.camera) params.set('cam', photo.camera)
  if (photo.location) params.set('l', photo.location)
  if (photo.date) params.set('d', photo.date)
  params.set('a', photo.aspect)
  params.set('f', photo.featured ? '1' : '0')
  if (photo.description) params.set('dsc', photo.description)

  const queryString = params.toString()
  // URL-safe base64 encoding (replace + with -, / with _, and strip padding =)
  const base64 = btoa(unescape(encodeURIComponent(queryString)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return base64
}

export function deserializeMetadata(base64: string, publicId: string, cloudName: string): Photo | null {
  try {
    let str = base64.replace(/-/g, '+').replace(/_/g, '/')
    while (str.length % 4) {
      str += '='
    }
    const decoded = decodeURIComponent(escape(atob(str)))
    const params = new URLSearchParams(decoded)

    const title = params.get('t') || 'Untitled'
    const category = (params.get('c') || 'Cinematic') as PhotoCategory
    const camera = params.get('cam') || ''
    const location = params.get('l') || ''
    const date = params.get('d') || ''
    const aspect = (params.get('a') || 'wide') as 'tall' | 'wide' | 'square'
    const featured = params.get('f') === '1'
    const description = params.get('dsc') || ''

    // Optimize image transformations using Cloudinary CDN
    const optimizedSrc = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1600/${publicId}`
    const previewSrc = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_600/${publicId}`

    return {
      id: publicId,
      slug: publicId.replace(/\//g, '-'),
      title,
      category,
      camera,
      location,
      date,
      aspect,
      featured,
      src: optimizedSrc,
      displayUrl: optimizedSrc,
      previewUrl: previewSrc,
      alt: title,
      description,
      likes: 0,
      views: 0
    }
  } catch (e) {
    console.error('[localDB] Failed to deserialize metadata for publicId:', publicId, e)
    return null
  }
}

// Generate secure SHA-1 signature on client browser using native SubtleCrypto Web API
export async function generateCloudinarySignature(params: Record<string, string>, apiSecret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort()
  const signString = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join('&') + apiSecret

  const buffer = new TextEncoder().encode(signString)
  const hash = await crypto.subtle.digest('SHA-1', buffer)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// --- PHOTOS MANAGER ---
export function getLocalPhotos(): Photo[] {
  const local = localStorage.getItem('gallery_photos')
  if (local) {
    try {
      const parsed = JSON.parse(local)
      return parsed.map((img: any) => ({
        id: img.id || String(img._id),
        slug: img.slug || img.id || String(img._id),
        title: img.title || 'Untitled',
        category: (img.category || 'Cinematic') as PhotoCategory,
        location: img.location || '',
        camera: img.camera || '',
        lens: img.lens || '',
        featured: !!img.featured,
        likes: Number(img.likes) || 0,
        views: Number(img.views) || 0,
        aspect: img.aspect || 'wide',
        src: img.src || img.displayUrl || '',
        displayUrl: img.displayUrl || img.src || '',
        alt: img.alt || img.title || '',
        date: img.date || '',
        description: img.description || '',
        tags: img.tags || [],
        aiTags: img.aiTags || [],
        mood: img.mood || '',
        dominantColors: img.dominantColors || [],
      }))
    } catch (e) {
      console.error('[localDB] Error parsing gallery_photos, reverting to default:', e)
    }
  }
  // Initialize with seed
  const seeded = galleryImages.map((img) => ({
    id: img.id,
    slug: img.id,
    title: img.title,
    category: img.category as PhotoCategory,
    location: img.location,
    camera: img.camera,
    lens: '',
    featured: false,
    likes: 0,
    views: 0,
    aspect: img.aspect,
    src: img.src,
    displayUrl: img.src,
    alt: img.alt,
    date: img.date,
  }))
  localStorage.setItem('gallery_photos', JSON.stringify(seeded))
  return seeded
}

export async function getDynamicPhotos(): Promise<Photo[]> {
  const config = getCloudinaryConfig()
  if (!config) {
    return getLocalPhotos()
  }

  try {
    const listUrl = `https://res.cloudinary.com/${config.cloudName}/image/list/cis_gallery.json`
    const res = await fetch(listUrl + '?t=' + Date.now())
    if (!res.ok) {
      throw new Error(`Cloudinary list error: ${res.status}`)
    }
    const data = await res.json()
    if (data && Array.isArray(data.resources)) {
      const parsedPhotos: Photo[] = []
      
      const sortedResources = data.resources.sort((a: any, b: any) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      for (const resource of sortedResources) {
        const publicId = resource.public_id
        const slashIdx = publicId.indexOf('/')
        if (slashIdx !== -1) {
          const base64 = publicId.substring(slashIdx + 1)
          const photo = deserializeMetadata(base64, publicId, config.cloudName)
          if (photo) {
            const stored = getLocalPhotos()
            const match = stored.find((p) => p.id === publicId)
            if (match) {
              photo.likes = match.likes || 0
              photo.views = match.views || 0
              photo.commentCount = match.commentCount || 0
            }
            parsedPhotos.push(photo)
          }
        }
      }

      const local = getLocalPhotos()
      const merged = parsedPhotos.map((p) => {
        const match = local.find((l) => l.id === p.id)
        return match ? { ...p, likes: match.likes, views: match.views } : p
      })
      saveLocalPhotos(merged)

      return parsedPhotos
    }
  } catch (err) {
    console.warn('[Cloudinary Fetch] Reverting to cached local storage photos:', err)
  }

  return getLocalPhotos()
}

export function saveLocalPhotos(photos: Photo[]) {
  localStorage.setItem('gallery_photos', JSON.stringify(photos))
}

export function incrementPhotoLike(photoId: string): number {
  const photos = getLocalPhotos()
  const idx = photos.findIndex((p) => p.id === photoId)
  if (idx !== -1) {
    photos[idx].likes = (photos[idx].likes || 0) + 1
    saveLocalPhotos(photos)
    return photos[idx].likes
  }
  return 0
}

export function incrementPhotoView(photoId: string): number {
  const photos = getLocalPhotos()
  const idx = photos.findIndex((p) => p.id === photoId)
  if (idx !== -1) {
    photos[idx].views = (photos[idx].views || 0) + 1
    saveLocalPhotos(photos)
    return photos[idx].views
  }
  return 0
}

// --- SETTINGS MANAGER ---
export function getLocalSettings(): SiteSettings {
  const local = localStorage.getItem('gallery_settings')
  if (local) {
    try {
      return JSON.parse(local)
    } catch {
      // Revert
    }
  }
  localStorage.setItem('gallery_settings', JSON.stringify(defaultSettings))
  return defaultSettings
}

export function saveLocalSettings(settings: SiteSettings) {
  localStorage.setItem('gallery_settings', JSON.stringify(settings))
}

// --- COMMENTS MANAGER ---
export function getLocalComments(photoId: string): LocalComment[] {
  const local = localStorage.getItem(`gallery_comments_${photoId}`)
  if (local) {
    try {
      return JSON.parse(local)
    } catch {
      return []
    }
  }
  return []
}

export function saveLocalComments(photoId: string, comments: LocalComment[]) {
  localStorage.setItem(`gallery_comments_${photoId}`, JSON.stringify(comments))
}

export function addLocalComment(photoId: string, authorName: string, content: string): LocalComment {
  const comments = getLocalComments(photoId)
  const newComment: LocalComment = {
    id: Math.random().toString(36).substring(2, 9),
    photoId,
    authorName,
    content,
    createdAt: new Date().toISOString(),
    replies: []
  }
  comments.push(newComment)
  saveLocalComments(photoId, comments)

  const photos = getLocalPhotos()
  const idx = photos.findIndex((p) => p.id === photoId)
  if (idx !== -1) {
    photos[idx].commentCount = (photos[idx].commentCount || 0) + 1
    saveLocalPhotos(photos)
  }

  return newComment
}

// --- FAVORITES MANAGER ---
export function toggleLocalFavorite(photoId: string): boolean {
  const favsStr = localStorage.getItem('gallery_favorites')
  let favs: string[] = []
  if (favsStr) {
    try {
      favs = JSON.parse(favsStr)
    } catch {
      favs = []
    }
  }
  const isFav = favs.includes(photoId)
  if (isFav) {
    favs = favs.filter((id) => id !== photoId)
  } else {
    favs.push(photoId)
  }
  localStorage.setItem('gallery_favorites', JSON.stringify(favs))
  return !isFav
}

export function getLocalFavoriteStatus(photoId: string): boolean {
  const favsStr = localStorage.getItem('gallery_favorites')
  if (!favsStr) return false
  try {
    const favs = JSON.parse(favsStr) as string[]
    return favs.includes(photoId)
  } catch {
    return false
  }
}

// --- INQUIRIES MANAGER ---
export function getLocalInquiries(): LocalInquiry[] {
  const local = localStorage.getItem('gallery_inquiries')
  if (local) {
    try {
      return JSON.parse(local)
    } catch {
      return []
    }
  }
  return []
}

export function saveLocalInquiries(inquiries: LocalInquiry[]) {
  localStorage.setItem('gallery_inquiries', JSON.stringify(inquiries))
}

export function addLocalInquiry(name: string, email: string, message: string, type: string): LocalInquiry {
  const inquiries = getLocalInquiries()
  const newInq: LocalInquiry = {
    _id: Math.random().toString(36).substring(2, 9),
    name,
    email,
    message,
    type,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
  inquiries.unshift(newInq)
  saveLocalInquiries(inquiries)
  return newInq
}
