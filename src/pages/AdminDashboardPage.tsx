import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getLocalSettings,
  type LocalInquiry,
  saveLocalPhotos,
  getLocalPhotos,
  subscribeSettings,
  subscribeInquiries,
  dbSaveSettings,
  dbDeleteInquiry,
  getDynamicPhotos,
} from '../utils/localDB'
import { PhotoLibraryErrorBoundary } from '../components/admin/PhotoLibraryErrorBoundary'
import type { Photo, PhotoCategory } from '../types/photo'
import { SiteSettings } from '../data/settings'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [inquiries, setInquiries] = useState<LocalInquiry[]>([])
  // UI state
  const [activeTab, setActiveTab] = useState<'gallery' | 'settings' | 'json' | 'inquiries'>('settings')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Selected file for upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Photo form state
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    src: '',
    category: 'Cinematic' as PhotoCategory,
    location: '',
    camera: '',
    lens: '',
    date: '',
    aspect: 'wide' as 'tall' | 'wide' | 'square',
    featured: false,
    alt: '',
    description: '',
  })

  // Editing state
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    id: string
    title: string
    category: PhotoCategory
    location: string
    camera: string
    lens: string
    date: string
    aspect: 'tall' | 'wide' | 'square'
    featured: boolean
    alt: string
    description: string
    src: string
  } | null>(null)

  // JSON View state
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>({
    title: '',
    subtitle: '',
    bioTitle: '',
    bioDescription: '',
    contactEmail: '',
    instagramUrl: '',
    veroUrl: '',
    ambientTrack: 'rainy_nights',
    passcode: '',
  })

  console.log("Photo Library rendering. Photos state count:", Array.isArray(photos) ? photos.length : 'undefined')

  useEffect(() => {
    console.log("Photo Library mounted");

    // 1. Initial local settings fallback
    const allSettings = getLocalSettings()
    setSettingsForm(allSettings)

    // 2. Fetch photos dynamically on mount
    getDynamicPhotos().then((latestPhotos) => {
      console.log("Fetched image data on mount:", latestPhotos);
      setPhotos(latestPhotos)
      setJsonText(JSON.stringify(latestPhotos, null, 2))
    })

    const unsubSettings = subscribeSettings((latestSettings) => {
      setSettingsForm(latestSettings)
    })

    const unsubInquiries = subscribeInquiries((latestInquiries) => {
      setInquiries(latestInquiries)
    })

    const handleGalleryUpdated = () => {
      getDynamicPhotos().then((latestPhotos) => {
        console.log("Fetched image data on update:", latestPhotos);
        setPhotos(latestPhotos)
        setJsonText(JSON.stringify(latestPhotos, null, 2))
      })
    }
    window.addEventListener('gallery_updated', handleGalleryUpdated)

    return () => {
      if (unsubSettings) unsubSettings()
      if (unsubInquiries) unsubInquiries()
      window.removeEventListener('gallery_updated', handleGalleryUpdated)
    }
  }, [])

  const triggerNotification = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleLogout = () => {
    console.log('[Logout] Clearing admin access state...')
    localStorage.setItem('is_admin', 'false')
    navigate('/')
  }

  // --- EXPORT / BACKUP JSON ---
  const handleExportJson = () => {
    console.log("handleExportJson triggered");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(photos, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `gallery_backup_${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    triggerNotification('Gallery backup file generated.')
  }

  // --- IMPORT JSON ---
  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const parsed = JSON.parse(content)
        if (!Array.isArray(parsed)) {
          throw new Error('Gallery data must be a JSON array of photos.')
        }

        if (!confirm(`Are you sure you want to overwrite your entire gallery on disk with the imported ${parsed.length} photos?`)) {
          return
        }

        // Post to the backend endpoint to overwrite gallery.json
        const response = await fetch('/api/local-gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsed)
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || 'Failed to import gallery data to disk')
        }

        saveLocalPhotos(parsed)
        setPhotos(parsed)
        setJsonText(JSON.stringify(parsed, null, 2))
        window.dispatchEvent(new Event('gallery_updated'))
        triggerNotification('Gallery data imported and updated on disk.')
      } catch (err: any) {
        alert(`Import Failed: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  // --- ADD / UPLOAD PHOTO ---
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("handleAddPhoto triggered");

    if (!selectedFile) {
      alert('Please select an image file to upload.')
      return
    }
    if (!newPhoto.title) {
      alert('Please enter a photograph title.')
      return
    }

    setUploadStatus('uploading')
    setUploadError(null)

    try {
      const reader = new FileReader()
      reader.readAsDataURL(selectedFile)
      reader.onload = async () => {
        try {
          const fileData = reader.result as string

          console.log("Uploading locally to disk via local CMS API...");
          const response = await fetch('/api/local-upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: newPhoto.title,
              category: newPhoto.category,
              filename: selectedFile.name,
              fileData,
              aspect: newPhoto.aspect,
              location: newPhoto.location,
              camera: newPhoto.camera,
              date: newPhoto.date,
              description: newPhoto.description
            })
          })

          if (!response.ok) {
            const errData = await response.json()
            throw new Error(errData.error || 'Local upload failed')
          }

          const result = await response.json()
          const item = result.item

          if (item) {
            const newPhotoEntry: Photo = {
              id: String(item.id),
              slug: String(item.id),
              title: item.title || 'Untitled',
              category: item.category as PhotoCategory,
              location: item.location || '',
              camera: item.camera || '',
              lens: '',
              featured: !!item.featured,
              likes: 0,
              views: 0,
              commentCount: 0,
              aspect: (item.aspect || 'wide') as 'tall' | 'wide' | 'square',
              src: item.image || '',
              displayUrl: item.image || '',
              alt: item.title || '',
              date: item.date || '',
              description: item.description || '',
            }

            const current = getLocalPhotos()
            const updated = [newPhotoEntry, ...current]
            saveLocalPhotos(updated)
            setPhotos(updated)
          }

          setUploadStatus('success')
          setSelectedFile(null)

          setNewPhoto({
            title: '',
            src: '',
            category: 'Cinematic',
            location: '',
            camera: '',
            lens: '',
            date: '',
            aspect: 'wide',
            featured: false,
            alt: '',
            description: '',
          })

          const fileInput = document.getElementById('photo-file-input') as HTMLInputElement
          if (fileInput) fileInput.value = ''

          triggerNotification('Photograph uploaded and saved locally to disk.')
          window.dispatchEvent(new Event('gallery_updated'))
        } catch (err: any) {
          console.error('[Upload Error]', err)
          setUploadStatus('error')
          setUploadError(err.message || 'Upload failed.')
        }
      }
      reader.onerror = () => {
        throw new Error('File reading failed')
      }
    } catch (err: any) {
      console.error('[Upload Error]', err)
      setUploadStatus('error')
      setUploadError(err.message || 'Direct upload request failed.')
    }
  }

  // --- DELETE PHOTO ---
  const handleDeletePhoto = async (photo: Photo) => {
    console.log("handleDeletePhoto triggered for:", photo);
    const photoId = photo?.id || (photo as any)?.public_id || "";
    if (!photoId) {
      alert("Invalid photo ID.");
      return;
    }
    const title = photo?.title || "Untitled";

    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      console.log("Deleting photo locally from disk via local CMS API. ID:", photoId);
      const response = await fetch('/api/local-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: photoId })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Local delete failed')
      }

      const current = getLocalPhotos()
      const updated = current.filter((p) => p.id !== photoId)
      saveLocalPhotos(updated)
      setPhotos(updated)

      triggerNotification('Photograph deleted locally from disk.')
      window.dispatchEvent(new Event('gallery_updated'))
    } catch (err: any) {
      console.error('[Delete Error]', err)
      alert(`Deletion Failed: ${err.message}`)
    }
  }

  // --- START EDITING ---
  const startEditing = (photo: Photo) => {
    console.log("startEditing triggered for:", photo);
    const photoId = photo?.id || (photo as any)?.public_id || "";
    const title = photo?.title || "Untitled";
    const category = photo?.category || "Cinematic";
    const src = photo?.src || (photo as any)?.url || "";

    setEditingPhotoId(photoId)
    setEditForm({
      id: photoId,
      title: title,
      category: category,
      location: photo?.location || '',
      camera: photo?.camera || '',
      lens: photo?.lens || '',
      date: photo?.date || '',
      aspect: photo?.aspect || 'wide',
      featured: !!photo?.featured,
      alt: photo?.alt || title,
      description: photo?.description || '',
      src: src,
    })
  }

  // --- SAVE EDIT ---
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("handleSaveEdit triggered");
    if (!editForm) return

    try {
      console.log("Updating photo locally on disk via local CMS API. ID:", editForm.id);
      const response = await fetch('/api/local-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editForm.id,
          fields: {
            title: editForm.title,
            category: editForm.category,
            location: editForm.location,
            camera: editForm.camera,
            lens: editForm.lens,
            date: editForm.date,
            aspect: editForm.aspect,
            featured: editForm.featured,
            alt: editForm.alt || editForm.title,
            description: editForm.description,
          }
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Local update failed')
      }

      const current = getLocalPhotos()
      const updated = current.map((p) => {
        if (p.id === editForm.id) {
          return {
            ...p,
            title: editForm.title,
            category: editForm.category,
            location: editForm.location,
            camera: editForm.camera,
            lens: editForm.lens,
            date: editForm.date,
            aspect: editForm.aspect,
            featured: editForm.featured,
            alt: editForm.alt || editForm.title,
            description: editForm.description,
          }
        }
        return p
      })

      saveLocalPhotos(updated)
      setPhotos(updated)

      setEditingPhotoId(null)
      setEditForm(null)
      triggerNotification('Photograph details updated locally on disk.')
      window.dispatchEvent(new Event('gallery_updated'))
    } catch (err: any) {
      console.error('[Save Edit Error]', err)
      alert(`Edit Failed: ${err.message}`)
    }
  }

  // --- REORDER PHOTOS ---
  const handleMovePhoto = async (photoId: string, direction: 'up' | 'down') => {
    console.log("handleMovePhoto triggered for ID:", photoId, "direction:", direction);
    const index = photos.findIndex(p => p.id === photoId)
    if (index === -1) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= photos.length) return

    const updatedPhotos = [...photos]
    const [movedPhoto] = updatedPhotos.splice(index, 1)
    updatedPhotos.splice(newIndex, 0, movedPhoto)

    setPhotos(updatedPhotos)
    saveLocalPhotos(updatedPhotos)

    try {
      const response = await fetch('/api/local-reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reorderedList: updatedPhotos.map(p => p.id)
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Local reordering failed')
      }

      triggerNotification('Gallery order updated locally on disk.')
      window.dispatchEvent(new Event('gallery_updated'))
    } catch (err: any) {
      console.error('[Reorder Error]', err)
      alert(`Reordering Failed: ${err.message}`)
    }
  }

  // --- SAVE JSON ---
  const handleSaveJson = async () => {
    console.log("handleSaveJson triggered");
    setJsonError(null)
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) {
        throw new Error('Root element must be a JSON Array of Photos.')
      }

      // Write to disk
      const response = await fetch('/api/local-gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsed)
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to save JSON to disk')
      }

      saveLocalPhotos(parsed)
      setPhotos(parsed)
      window.dispatchEvent(new Event('gallery_updated'))
      triggerNotification('Raw JSON saved and synchronized successfully.')
    } catch (err: any) {
      setJsonError(err?.message || 'Invalid JSON syntax.')
    }
  }

  // --- SAVE SYSTEM SETTINGS ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    dbSaveSettings(settingsForm)
    triggerNotification('Configuration parameters saved successfully.')
  }

  const handleDeleteInquiry = (id: string) => {
    if (!window.confirm('Remove this message from inbox?')) return
    dbDeleteInquiry(id)
    triggerNotification('Inquiry message removed.')
  }

  return (
    <div className="min-h-screen bg-charcoal text-cream font-body selection:bg-gold selection:text-charcoal relative pb-16">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/5 blur-[100px] rounded-full pointer-events-none" />

      <header className="border-b border-white/10 py-6 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 bg-charcoal/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-display text-lg tracking-[0.3em] hover:text-gold transition-colors uppercase">
            Capture in Silences
          </Link>
          <span className="text-white/20">/</span>
          <span className="font-body text-xs tracking-widest text-gold uppercase font-semibold">
            Control Room (Dynamic CMS)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="cursor-hover border border-white/15 hover:border-red-400/50 hover:text-red-400 bg-transparent px-5 py-2 text-[10px] tracking-widest uppercase transition-all rounded-sm font-medium"
          >
            Exit Control Room
          </button>
        </div>
      </header>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50 bg-gold text-charcoal font-bold font-body text-xs tracking-widest uppercase px-6 py-3 shadow-[0_0_30px_rgba(201,169,98,0.3)] rounded-sm"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 md:px-12 mt-10 relative z-10">
        <div className="flex border-b border-white/10 gap-8 mb-10 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'settings', label: 'Settings' },
            { id: 'gallery', label: 'Photo Library' },
            { id: 'inquiries', label: `Inquiries Inbox (${inquiries.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-xs font-semibold tracking-widest uppercase relative transition-colors ${
                activeTab === tab.id ? 'text-gold' : 'text-cream-muted hover:text-cream'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-px bg-gold"
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'gallery' && (
            <PhotoLibraryErrorBoundary>
              <motion.div
                key="gallery-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-10"
              >
                <div className="lg:col-span-1 border border-white/10 p-6 md:p-8 bg-charcoal-light/20 backdrop-blur-sm rounded-sm">
                  <span className="font-body text-[10px] tracking-[0.3em] text-gold uppercase block mb-2">
                    Upload Photograph
                  </span>
                  <h3 className="font-display text-xl text-cream uppercase mb-6">
                    Upload Photo File
                  </h3>

                  <form onSubmit={handleAddPhoto} className="space-y-5">
                    <div className="space-y-2 border border-dashed border-white/10 p-4 bg-black/10 rounded-sm">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase cursor-pointer">
                        Select File
                      </label>
                      <input
                        type="file"
                        id="photo-file-input"
                        required
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files ? e.target.files[0] : null
                          setSelectedFile(file)
                        }}
                        className="w-full text-xs text-cream-muted file:bg-gold file:text-charcoal file:border-none file:px-4 file:py-2 file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:cursor-pointer hover:file:bg-gold-soft cursor-pointer"
                      />
                      {selectedFile && (
                        <p className="text-[10px] text-gold font-body tracking-wider uppercase mt-1">
                          File Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPhoto.title}
                        onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                        placeholder="e.g. Quiet Gaze"
                        className="w-full bg-charcoal border border-white/10 p-3 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                          Category
                        </label>
                        <select
                          value={newPhoto.category}
                          onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value as PhotoCategory })}
                          className="w-full bg-charcoal border border-white/10 p-3 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                        >
                          {['Portraits', 'Street', 'Nature', 'Monochrome', 'Cinematic', 'Travel'].map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                          Aspect Ratio
                        </label>
                        <select
                          value={newPhoto.aspect}
                          onChange={(e) => setNewPhoto({ ...newPhoto, aspect: e.target.value as any })}
                          className="w-full bg-charcoal border border-white/10 p-3 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                        >
                          <option value="wide">Wide (Landscape)</option>
                          <option value="tall">Tall (Portrait)</option>
                          <option value="square">Square</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                          Location
                        </label>
                        <input
                          type="text"
                          value={newPhoto.location}
                          onChange={(e) => setNewPhoto({ ...newPhoto, location: e.target.value })}
                          placeholder="Paris, France"
                          className="w-full bg-charcoal border border-white/10 p-3 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                          Date / Era
                        </label>
                        <input
                          type="text"
                          value={newPhoto.date}
                          onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
                          placeholder="March 2025"
                          className="w-full bg-charcoal border border-white/10 p-3 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                        Camera Body & Lens Info
                      </label>
                      <input
                        type="text"
                        value={newPhoto.camera}
                        onChange={(e) => setNewPhoto({ ...newPhoto, camera: e.target.value })}
                        placeholder="Sony A7IV · 85mm f/1.4"
                        className="w-full bg-charcoal border border-white/10 p-3 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                        Atmospheric Narrative
                      </label>
                      <textarea
                        value={newPhoto.description}
                        onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })}
                        placeholder="A short poetry line or caption..."
                        rows={2}
                        className="w-full bg-charcoal border border-white/10 p-3 text-sm text-cream focus:outline-none focus:border-gold/45 resize-none rounded-sm"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={newPhoto.featured}
                        onChange={(e) => setNewPhoto({ ...newPhoto, featured: e.target.checked })}
                        className="accent-gold h-4 w-4 bg-charcoal border-white/15"
                      />
                      <label htmlFor="featured" className="font-body text-xs text-cream-muted uppercase tracking-wider select-none">
                        Mark as Featured (Hero Loop)
                      </label>
                    </div>

                    {uploadStatus === 'uploading' && (
                      <div className="py-2 flex items-center justify-center gap-3">
                        <span className="animate-spin text-gold font-bold text-xs">⟳</span>
                        <p className="text-[10px] text-gold tracking-widest uppercase font-semibold">
                          Saving image and updating entries...
                        </p>
                      </div>
                    )}

                    {uploadStatus === 'error' && uploadError && (
                      <div className="p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-body font-mono">
                        Upload Error: {uploadError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={uploadStatus === 'uploading'}
                      className="w-full bg-gold hover:bg-gold-soft text-charcoal font-bold py-3.5 px-4 text-xs tracking-widest uppercase transition-all rounded-sm shadow-md hover:shadow-[0_0_20px_rgba(201,169,98,0.2)] mt-4 disabled:opacity-50"
                    >
                      Upload File to Gallery
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="border border-white/10 p-6 md:p-8 bg-charcoal-light/10 backdrop-blur-sm rounded-sm">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-display text-xl text-cream uppercase">Photographs Directory</h3>
                        <p className="text-cream-muted text-xs font-body mt-1">
                          Photographs archive — displaying {Array.isArray(photos) ? photos.length : 0} items.
                        </p>
                      </div>
                    </div>
                    <div className="p-4 border border-gold/15 bg-gold/5 text-gold text-xs font-body rounded-sm mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <span className="font-semibold block uppercase tracking-wider">ⓘ Git-Based Photography Database</span>
                        <span className="text-[10px] text-cream-muted font-normal mt-0.5 block">Changes are saved locally and go live upon git commit & push.</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleExportJson}
                          className="px-3 py-1.5 bg-gold hover:bg-gold-soft text-charcoal text-[9px] font-bold tracking-widest uppercase rounded-sm transition-all"
                        >
                          Backup / Export
                        </button>
                        <label className="px-3 py-1.5 border border-white/10 hover:border-gold/30 hover:text-gold text-[9px] font-bold tracking-widest uppercase rounded-sm cursor-pointer transition-colors">
                          Import JSON
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportJson}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <AnimatePresence>
                      {editingPhotoId && editForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border border-gold/30 bg-gold/5 p-6 mb-6 rounded-sm space-y-4"
                        >
                          <h4 className="font-display text-sm text-gold tracking-widest uppercase mb-4">
                            Edit Photo Details
                          </h4>
                          <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="block text-[9px] tracking-wider text-cream-muted uppercase">Title</label>
                              <input
                                type="text"
                                required
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="w-full bg-charcoal border border-white/10 p-2 text-xs text-cream focus:outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="block text-[9px] tracking-wider text-cream-muted uppercase">Category</label>
                                <select
                                  value={editForm.category}
                                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as PhotoCategory })}
                                  className="w-full bg-charcoal border border-white/10 p-2 text-xs text-cream focus:outline-none"
                                >
                                  {['Portraits', 'Street', 'Nature', 'Monochrome', 'Cinematic', 'Travel'].map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] tracking-wider text-cream-muted uppercase">Aspect</label>
                                <select
                                  value={editForm.aspect}
                                  onChange={(e) => setEditForm({ ...editForm, aspect: e.target.value as any })}
                                  className="w-full bg-charcoal border border-white/10 p-2 text-xs text-cream focus:outline-none"
                                >
                                  <option value="wide">Wide</option>
                                  <option value="tall">Tall</option>
                                  <option value="square">Square</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="block text-[9px] tracking-wider text-cream-muted uppercase">Location</label>
                                <input
                                  type="text"
                                  value={editForm.location}
                                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                  className="w-full bg-charcoal border border-white/10 p-2 text-xs text-cream focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] tracking-wider text-cream-muted uppercase">Date</label>
                                <input
                                  type="text"
                                  value={editForm.date}
                                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                  className="w-full bg-charcoal border border-white/10 p-2 text-xs text-cream focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[9px] tracking-wider text-cream-muted uppercase">Camera & Lens</label>
                              <input
                                type="text"
                                value={editForm.camera}
                                onChange={(e) => setEditForm({ ...editForm, camera: e.target.value })}
                                className="w-full bg-charcoal border border-white/10 p-2 text-xs text-cream focus:outline-none"
                              />
                            </div>

                            <div className="md:col-span-2 space-y-1">
                              <label className="block text-[9px] tracking-wider text-cream-muted uppercase">Atmospheric Caption</label>
                              <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                rows={2}
                                className="w-full bg-charcoal border border-white/15 p-2 text-xs text-cream focus:outline-none resize-none"
                              />
                            </div>

                            <div className="md:col-span-2 flex justify-between items-center pt-2">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={editForm.featured}
                                  onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })}
                                  className="accent-gold h-4 w-4"
                                />
                                <span className="text-[10px] text-cream-muted uppercase tracking-wider">
                                  Featured In Hero
                                </span>
                              </label>

                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPhotoId(null)
                                    setEditForm(null)
                                  }}
                                  className="px-4 py-2 border border-white/10 text-cream-muted hover:text-cream text-[10px] tracking-widest uppercase font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-5 py-2 bg-gold hover:bg-gold-soft text-charcoal text-[10px] tracking-widest uppercase font-bold"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* SEARCH INPUT BAR */}
                    <div className="mb-6">
                      <input
                        type="text"
                        placeholder="Search photos by title, category, location, camera, date, description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-charcoal border border-white/10 p-3 text-xs text-cream focus:outline-none focus:border-gold/45 rounded-sm placeholder-white/20"
                      />
                    </div>

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                      {!Array.isArray(photos) || photos.length === 0 ? (
                        <p className="text-cream-muted text-sm italic font-body py-8 text-center">
                          Archive is empty. Upload files to begin.
                        </p>
                      ) : (
                        (() => {
                          const filtered = photos.filter(p => {
                            const q = searchQuery.toLowerCase()
                            return (
                              p.title.toLowerCase().includes(q) ||
                              p.category.toLowerCase().includes(q) ||
                              (p.location && p.location.toLowerCase().includes(q)) ||
                              (p.camera && p.camera.toLowerCase().includes(q)) ||
                              (p.date && p.date.toLowerCase().includes(q)) ||
                              (p.description && p.description.toLowerCase().includes(q))
                            )
                          })

                          if (filtered.length === 0) {
                            return (
                              <p className="text-cream-muted text-sm italic font-body py-8 text-center">
                                No photographs match search criteria.
                              </p>
                            )
                          }

                          return filtered.map((p) => {
                            const pUrl = (p as any)?.url || p?.src || (p as any)?.image || p?.displayUrl || ""
                            const pId = (p as any)?.public_id || p?.id || ""
                            const pTitle = p?.title || "Untitled"
                            const pCategory = p?.category || "Cinematic"
                            const pLocation = p?.location || "No Location"
                            const pAspect = p?.aspect || "wide"
                            const pFeatured = !!p?.featured
                            
                            const isLocalAsset = pUrl.startsWith('/assets/') || pUrl.startsWith('/images/')
                            const fullIdx = photos.findIndex(item => item.id === pId)
                            const isFirst = fullIdx === 0
                            const isLast = fullIdx === photos.length - 1

                            return (
                              <div
                                key={pId}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-white/5 bg-charcoal/40 p-4 hover:border-gold/15 transition-all gap-4"
                              >
                                <div className="flex items-center gap-4">
                                  <img
                                    src={pUrl}
                                    alt={pTitle}
                                    className="w-14 h-14 object-cover border border-white/10 rounded-sm"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&q=80'
                                    }}
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-heading text-sm text-cream font-medium">{pTitle}</h4>
                                      <span className={`text-[8px] font-semibold tracking-wider px-1.5 py-0.5 rounded-sm uppercase ${
                                        isLocalAsset ? 'border border-gold/30 text-gold bg-gold/5' : 'border border-white/10 text-cream-muted'
                                      }`}>
                                        {isLocalAsset ? 'Local Photo' : 'Pre-seeded'}
                                      </span>
                                    </div>
                                    <p className="font-body text-[10px] text-cream-muted uppercase tracking-wider mt-1">
                                      {pCategory} · {pLocation} · {pAspect}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                  {/* Reordering Carets */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleMovePhoto(pId, 'up')}
                                      disabled={isFirst}
                                      className="p-1.5 border border-white/10 text-cream-muted hover:text-gold disabled:opacity-20 hover:border-gold/20 transition-all rounded-sm"
                                      title="Move Up"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMovePhoto(pId, 'down')}
                                      disabled={isLast}
                                      className="p-1.5 border border-white/10 text-cream-muted hover:text-gold disabled:opacity-20 hover:border-gold/20 transition-all rounded-sm"
                                      title="Move Down"
                                    >
                                      ▼
                                    </button>
                                  </div>

                                <button
                                  type="button"
                                  onClick={() => startEditing(p)}
                                  className="px-3 py-1.5 text-[10px] tracking-widest uppercase border border-white/10 text-cream-muted hover:border-gold/30 hover:text-gold transition-colors rounded-sm"
                                >
                                  Edit
                                </button>

                                {pFeatured && (
                                  <span className="px-2 py-1 text-[8px] bg-gold/10 border border-gold/30 text-gold font-bold uppercase tracking-wider rounded-sm">
                                    Hero Loop
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeletePhoto(p)}
                                  className="px-3 py-1.5 text-[10px] tracking-widest uppercase border border-red-500/10 text-red-400/80 hover:bg-red-500/10 hover:border-red-500/50 transition-colors rounded-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )
                        })
                      })()
                    )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </PhotoLibraryErrorBoundary>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="border border-gold/20 p-6 md:p-10 bg-charcoal-light/10 backdrop-blur-sm rounded-sm">
                {/* Cloud CMS Config Status */}
                <div className="border border-gold/20 p-6 bg-black/10 rounded-sm mb-6">
                  <span className="font-body text-[10px] tracking-[0.3em] text-gold uppercase block mb-2">
                    System Status
                  </span>
                  <h3 className="font-display text-lg text-cream uppercase mb-3">Cloudinary CMS Active</h3>
                  <p className="font-body text-xs text-cream-muted leading-relaxed">
                    The website is configured to run direct client-side CRUD synchronization with your Cloudinary media folders. Changes appear instantly for all global users.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-body text-[9px] uppercase tracking-widest text-emerald-400 font-bold">Cloud Serverless Sync Active</span>
                  </div>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <span className="font-body text-[10px] tracking-[0.3em] text-gold uppercase block mb-6">
                      Brand Parameters
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-1">
                        <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                          Site Brand Title
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.title}
                          onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                          className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                          Sub-title / Tagline
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.subtitle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, subtitle: e.target.value })}
                          className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 mb-6">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                        Bio Section Title
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.bioTitle}
                        onChange={(e) => setSettingsForm({ ...settingsForm, bioTitle: e.target.value })}
                        className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                      />
                    </div>

                    <div className="space-y-1 mb-6">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                        Narrative Story / Bio Text
                      </label>
                      <textarea
                        required
                        value={settingsForm.bioDescription}
                        onChange={(e) => setSettingsForm({ ...settingsForm, bioDescription: e.target.value })}
                        rows={4}
                        className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 resize-none rounded-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                      <div className="space-y-1">
                        <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          required
                          value={settingsForm.contactEmail}
                          onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                          className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                          Instagram URL
                        </label>
                        <input
                          type="url"
                          value={settingsForm.instagramUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                          className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                          Vero URL
                        </label>
                        <input
                          type="url"
                          value={settingsForm.veroUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, veroUrl: e.target.value })}
                          className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-1">
                        <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                          Soundtrack Choice
                        </label>
                        <select
                          value={settingsForm.ambientTrack}
                          onChange={(e) => setSettingsForm({ ...settingsForm, ambientTrack: e.target.value as any })}
                          className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                        >
                          <option value="rainy_nights">Rainy Nights (Lo-Fi Vinyl Synth)</option>
                          <option value="golden_hour">Golden Hour (Ambient Acoustic Piano)</option>
                          <option value="deep_silence">Deep Silence (Cinematic Drone)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                          Vault Access Passcode
                        </label>
                        <input
                          type="text"
                          required
                          value={settingsForm.passcode}
                          onChange={(e) => setSettingsForm({ ...settingsForm, passcode: e.target.value })}
                          className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gold hover:bg-gold-soft text-charcoal font-bold py-4 px-4 text-xs tracking-widest uppercase transition-all rounded-sm shadow-md hover:shadow-[0_0_20px_rgba(201,169,98,0.2)] mt-6"
                  >
                    Save brand settings
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'json' && (
            <motion.div
              key="json-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="border border-white/10 p-6 md:p-10 bg-charcoal-light/10 backdrop-blur-sm rounded-sm"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <span className="font-body text-[10px] tracking-[0.3em] text-gold uppercase block mb-2">
                    Advanced Developer Access
                  </span>
                  <h3 className="font-display text-2xl text-cream uppercase">Raw JSON Cache</h3>
                </div>

                <button
                  onClick={handleSaveJson}
                  className="bg-gold hover:bg-gold-soft text-charcoal font-bold py-2.5 px-6 text-xs tracking-widest uppercase transition-all rounded-sm shadow-md"
                >
                  Commit JSON Updates
                </button>
              </div>

              <p className="text-cream-muted text-xs font-body mb-4">
                This reads the local fallback metadata list. NOTE: Direct modifications here will **not** rename files on Cloudinary. To edit Cloudinary tags, use the "Edit" form on the Gallery Manager.
              </p>

              {jsonError && <div className="text-red-400/90 text-xs font-body mb-4 p-3 border border-red-500/20 bg-red-500/5 font-mono">{jsonError}</div>}

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={22}
                className="w-full bg-charcoal-light/40 border border-white/15 p-4 text-xs font-mono text-cream focus:outline-none focus:border-gold/45 resize-none leading-relaxed rounded-sm selection:bg-gold/30"
              />
            </motion.div>
          )}

          {activeTab === 'inquiries' && (
            <motion.div
              key="inquiries-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="border border-white/10 p-6 md:p-8 bg-charcoal-light/10 backdrop-blur-sm rounded-sm"
            >
              <span className="font-body text-[10px] tracking-[0.3em] text-gold uppercase block mb-2">
                User Connections
              </span>
              <h3 className="font-display text-2xl text-cream uppercase mb-6">Inquiries & Message Log</h3>

              <div className="space-y-6">
                {inquiries.length === 0 ? (
                  <p className="text-cream-muted text-sm italic font-body py-12 text-center border border-dashed border-white/10">
                    Your connection archive is currently empty. Direct messages sent via the homepage contact form will pop up here.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {inquiries.map((inq) => (
                      <div
                        key={inq._id}
                        className="border border-white/10 bg-charcoal/30 p-6 rounded-sm relative hover:border-gold/15 transition-all"
                      >
                        <button
                          onClick={() => handleDeleteInquiry(inq._id)}
                          className="absolute top-4 right-4 text-cream-muted/50 hover:text-red-400 transition-colors font-body text-xs font-semibold uppercase tracking-wider"
                        >
                          Delete
                        </button>

                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-2 py-0.5 border border-gold/40 text-[9px] font-bold text-gold uppercase tracking-widest rounded-sm">
                            {inq.type}
                          </span>
                          <span className="text-[10px] text-cream-muted/60 font-body">
                            {new Date(inq.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <h4 className="font-heading text-base text-cream">{inq.name}</h4>
                        <a
                          href={`mailto:${inq.email}`}
                          className="font-body text-xs text-gold/80 hover:text-gold transition-colors block mt-1"
                        >
                          {inq.email}
                        </a>

                        <div className="mt-4 font-body text-sm text-cream-muted/95 border-t border-white/5 pt-4 leading-relaxed italic">
                          "{inq.message}"
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
