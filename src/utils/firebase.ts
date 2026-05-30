import {
  getLocalPhotos,
  getLocalSettings,
  getLocalInquiries,
  saveLocalPhotos,
  saveLocalSettings,
  addLocalInquiry,
  type LocalInquiry,
} from './localDB'
import galleryData from '../data/gallery.json'
import type { Photo } from '../types/photo'
import type { SiteSettings } from '../data/settings'

export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export function getFirebaseConfig(): FirebaseConfig | null {
  return null
}

export function saveFirebaseConfig(_config: FirebaseConfig) {}

export function getDb() {
  return null
}

// --- LOCAL REALTIME FACADE SUBSCRIPTIONS ---

export function subscribePhotos(callback: (photos: Photo[]) => void) {
  const mapList = (): Photo[] => {
    return (galleryData as any[]).map((item) => ({
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

// --- DATABASE OPERATIONS (MOCK/FACADE) ---

export async function dbAddPhoto(photo: Omit<Photo, 'likes' | 'views'>) {
  const current = getLocalPhotos()
  const newPhoto: Photo = { ...photo, likes: 0, views: 0 }
  saveLocalPhotos([newPhoto, ...current])
  window.dispatchEvent(new Event('gallery_updated'))
}

export async function dbUpdatePhoto(id: string, fields: Partial<Photo>) {
  const current = getLocalPhotos()
  const updated = current.map((p) => (p.id === id ? { ...p, ...fields } : p))
  saveLocalPhotos(updated)
  window.dispatchEvent(new Event('gallery_updated'))
}

export async function dbDeletePhoto(id: string) {
  const current = getLocalPhotos()
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
