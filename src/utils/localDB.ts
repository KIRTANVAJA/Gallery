import { defaultSettings, type SiteSettings } from '../data/settings'
import type { Photo, PhotoCategory } from '../types/photo'

import seededPhotos from '../data/gallery.json'

// --- INDEXEDDB CONFIG & PERSISTENCE HELPERS ---
const DB_NAME = 'cis_portfolio_db';
const STORE_NAME = 'portfolio_store';

function getIndexedDBData(key: string): Promise<any> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const getReq = store.get(key);
        getReq.onsuccess = () => {
          resolve(getReq.result);
        };
        getReq.onerror = () => {
          resolve(null);
        };
      };
      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

function setIndexedDBData(key: string, value: any): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const putReq = store.put(value, key);
        putReq.onsuccess = () => {
          resolve(true);
        };
        putReq.onerror = () => {
          resolve(false);
        };
      };
      request.onerror = () => {
        resolve(false);
      };
    } catch {
      resolve(false);
    }
  });
}

export async function initPersistentStorage(): Promise<void> {

  // Load photos from IndexedDB
  const cachedPhotos = await getIndexedDBData('gallery_photos');
  if (cachedPhotos && Array.isArray(cachedPhotos) && cachedPhotos.length > 0) {
    localStorage.setItem('gallery_photos', JSON.stringify(cachedPhotos));
  } else {
    // If empty in IndexedDB, see if we have it in localStorage
    const localPhotosStr = localStorage.getItem('gallery_photos');
    if (localPhotosStr) {
      try {
        const parsed = JSON.parse(localPhotosStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await setIndexedDBData('gallery_photos', parsed);
        }
      } catch {}
    }
  }

  // Load settings from IndexedDB
  const cachedSettings = await getIndexedDBData('gallery_settings');
  if (cachedSettings) {
    localStorage.setItem('gallery_settings', JSON.stringify(cachedSettings));
  } else {
    const localSettingsStr = localStorage.getItem('gallery_settings');
    if (localSettingsStr) {
      try {
        const parsed = JSON.parse(localSettingsStr);
        await setIndexedDBData('gallery_settings', parsed);
      } catch {}
    }
  }

  // Load inquiries from IndexedDB
  const cachedInquiries = await getIndexedDBData('gallery_inquiries');
  if (cachedInquiries && Array.isArray(cachedInquiries)) {
    localStorage.setItem('gallery_inquiries', JSON.stringify(cachedInquiries));
  } else {
    const localInquiriesStr = localStorage.getItem('gallery_inquiries');
    if (localInquiriesStr) {
      try {
        const parsed = JSON.parse(localInquiriesStr);
        await setIndexedDBData('gallery_inquiries', parsed);
      } catch {}
    }
  }

  // Dispatch event to update hooks with loaded values
  window.dispatchEvent(new Event('gallery_updated'));
}

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

export function getPhotoLikes(photoId: string): number {
  const dictStr = localStorage.getItem('gallery_likes_dict')
  if (dictStr) {
    try {
      const dict = JSON.parse(dictStr)
      if (dict[photoId] !== undefined) {
        return Number(dict[photoId]) || 0
      }
    } catch {}
  }
  // Fallback: see if it exists in localPhotos
  const photos = getLocalPhotosRaw()
  const photo = photos.find((p) => p.id === photoId)
  return photo ? (photo.likes || 0) : 0
}

export function incrementPhotoLike(photoId: string): number {
  const dictStr = localStorage.getItem('gallery_likes_dict') || '{}'
  let dict: Record<string, number> = {}
  try {
    dict = JSON.parse(dictStr)
  } catch {}
  
  let current = dict[photoId]
  if (current === undefined) {
    current = getPhotoLikes(photoId)
  }
  const newValue = current + 1
  dict[photoId] = newValue
  localStorage.setItem('gallery_likes_dict', JSON.stringify(dict))

  // Sync to localPhotos
  const photos = getLocalPhotosRaw()
  const idx = photos.findIndex((p) => p.id === photoId)
  if (idx !== -1) {
    photos[idx].likes = newValue
    saveLocalPhotos(photos)
  }
  return newValue
}

export function getPhotoViews(photoId: string): number {
  const dictStr = localStorage.getItem('gallery_views_dict')
  if (dictStr) {
    try {
      const dict = JSON.parse(dictStr)
      if (dict[photoId] !== undefined) {
        return Number(dict[photoId]) || 0
      }
    } catch {}
  }
  // Fallback
  const photos = getLocalPhotosRaw()
  const photo = photos.find((p) => p.id === photoId)
  return photo ? (photo.views || 0) : 0
}

export function incrementPhotoView(photoId: string): number {
  const dictStr = localStorage.getItem('gallery_views_dict') || '{}'
  let dict: Record<string, number> = {}
  try {
    dict = JSON.parse(dictStr)
  } catch {}
  
  let current = dict[photoId]
  if (current === undefined) {
    current = getPhotoViews(photoId)
  }
  const newValue = current + 1
  dict[photoId] = newValue
  localStorage.setItem('gallery_views_dict', JSON.stringify(dict))

  // Sync to localPhotos
  const photos = getLocalPhotosRaw()
  const idx = photos.findIndex((p) => p.id === photoId)
  if (idx !== -1) {
    photos[idx].views = newValue
    saveLocalPhotos(photos)
  }
  return newValue
}

// --- PHOTOS MANAGER ---
function getLocalPhotosRaw(): Photo[] {
  const local = localStorage.getItem('gallery_photos')
  if (local) {
    try {
      const parsed = JSON.parse(local)
      const scrubbed = Array.isArray(parsed)
        ? parsed.filter((img: any) => {
            const src = img.src || img.image || img.displayUrl || ''
            return !src.startsWith('data:image/')
          })
        : []
      
      if (scrubbed.length > 0) {
        return scrubbed.map((img: any) => ({
          id: String(img.id),
          slug: img.slug || String(img.id),
          title: img.title || 'Untitled',
          category: (img.category || 'Cinematic') as PhotoCategory,
          location: img.location || '',
          camera: img.camera || '',
          lens: img.lens || '',
          featured: !!img.featured,
          likes: Number(img.likes) || 0,
          views: Number(img.views) || 0,
          commentCount: Number(img.commentCount) || 0,
          aspect: img.aspect || 'wide',
          src: img.src || img.image || img.displayUrl || '',
          displayUrl: img.displayUrl || img.image || img.src || '',
          alt: img.alt || img.title || '',
          date: img.date || '',
          description: img.description || '',
          tags: img.tags || [],
          aiTags: img.aiTags || [],
          mood: img.mood || '',
          dominantColors: img.dominantColors || [],
        }))
      }
    } catch {}
  }
  return (seededPhotos as any[]).map((img) => ({
    id: String(img.id),
    slug: String(img.id),
    title: img.title || 'Untitled',
    category: img.category as PhotoCategory,
    location: img.location || '',
    camera: img.camera || '',
    lens: '',
    featured: !!img.featured,
    likes: Number(img.likes) || 0,
    views: Number(img.views) || 0,
    commentCount: Number(img.commentCount) || 0,
    aspect: (img.aspect || 'wide') as 'tall' | 'wide' | 'square',
    src: img.image || img.src || '',
    displayUrl: img.image || img.src || '',
    alt: img.alt || img.title || '',
    date: img.date || '',
    description: img.description || '',
  }))
}

export function getLocalPhotos(): Photo[] {
  const photos = getLocalPhotosRaw()
  return photos.map(photo => ({
    ...photo,
    likes: getPhotoLikes(photo.id),
    views: getPhotoViews(photo.id)
  }))
}

export function saveLocalPhotos(photos: Photo[]) {
  const scrubbed = photos.filter((p) => {
    const src = p.src || p.displayUrl || ''
    return !src.startsWith('data:image/')
  })
  localStorage.setItem('gallery_photos', JSON.stringify(scrubbed))
  setIndexedDBData('gallery_photos', scrubbed)
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
  setIndexedDBData('gallery_settings', settings)
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
  setIndexedDBData('gallery_inquiries', inquiries)
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

// --- LOCAL REALTIME FACADE SUBSCRIPTIONS (CONSOLIDATED FROM FIREBASE MOCK LAYER) ---

export function subscribePhotos(callback: (photos: Photo[]) => void) {
  const mapList = (): Photo[] => {
    return getLocalPhotos()
  }

  callback(mapList())

  const handler = () => {
    callback(mapList())
  }

  window.addEventListener('gallery_updated', handler)
  return () => window.removeEventListener('gallery_updated', handler)
}

export function subscribeSettings(callback: (settings: SiteSettings) => void) {
  callback(getLocalSettings())

  const handler = () => {
    callback(getLocalSettings())
  }

  window.addEventListener('gallery_updated', handler)
  return () => window.removeEventListener('gallery_updated', handler)
}

export function subscribeInquiries(callback: (inquiries: LocalInquiry[]) => void) {
  callback(getLocalInquiries())

  const handler = () => {
    callback(getLocalInquiries())
  }

  window.addEventListener('gallery_updated', handler)
  return () => window.removeEventListener('gallery_updated', handler)
}

// --- DATABASE OPERATIONS (MOCK/FACADE CONSOLIDATED FROM FIREBASE MOCK LAYER) ---

export async function dbAddPhoto(photo: Omit<Photo, 'likes' | 'views'>) {
  const current = getLocalPhotosRaw()
  const newPhoto: Photo = { 
    ...photo, 
    likes: getPhotoLikes(photo.id), 
    views: getPhotoViews(photo.id) 
  }
  saveLocalPhotos([newPhoto, ...current])
  window.dispatchEvent(new Event('gallery_updated'))
}

export async function dbUpdatePhoto(id: string, fields: Partial<Photo>) {
  const current = getLocalPhotosRaw()
  const updated = current.map((p) => (p.id === id ? { ...p, ...fields } : p))
  saveLocalPhotos(updated)
  window.dispatchEvent(new Event('gallery_updated'))
}

export async function dbDeletePhoto(id: string) {
  const current = getLocalPhotosRaw()
  const updated = current.filter((p) => p.id !== id)
  saveLocalPhotos(updated)
  window.dispatchEvent(new Event('gallery_updated'))
}

export async function dbSaveSettings(settings: SiteSettings) {
  saveLocalSettings(settings)
  window.dispatchEvent(new Event('gallery_updated'))
}

export async function dbAddInquiry(name: string, email: string, message: string, type: string) {
  addLocalInquiry(name, email, message, type)
  window.dispatchEvent(new Event('gallery_updated'))
}

export async function dbDeleteInquiry(id: string) {
  const current = getLocalInquiries()
  const updated = current.filter((inq) => inq._id !== id)
  localStorage.setItem('gallery_inquiries', JSON.stringify(updated))
  window.dispatchEvent(new Event('gallery_updated'))
}

export async function dbIncrementPhotoLike(_id: string) {}
export async function dbIncrementPhotoView(_id: string) {}
export async function seedFirebaseIfEmpty() {}

export async function getDynamicPhotos(): Promise<Photo[]> {
  try {
    const res = await fetch('/api/local-gallery')
    if (res.ok) {
      const livePhotos = await res.json()
      if (Array.isArray(livePhotos)) {
        return livePhotos.map((p) => ({
          ...p,
          id: String(p.id),
          slug: p.slug || String(p.id),
          likes: getPhotoLikes(String(p.id)),
          views: getPhotoViews(String(p.id)),
          commentCount: p.commentCount || 0
        }))
      }
    }
  } catch (err) {
    // Fail silently in production, fallback to statically imported JSON
  }

  return (seededPhotos as any[]).map((p) => ({
    ...p,
    id: String(p.id),
    slug: p.slug || String(p.id),
    likes: getPhotoLikes(String(p.id)),
    views: getPhotoViews(String(p.id)),
    commentCount: p.commentCount || 0
  }))
}
