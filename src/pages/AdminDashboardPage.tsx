import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getLocalPhotos,
  saveLocalPhotos,
  getLocalSettings,
  saveLocalSettings,
  getLocalInquiries,
  getCloudinaryConfig,
  saveCloudinaryConfig,
  serializeMetadata,
  generateCloudinarySignature,
  getDynamicPhotos,
  type LocalInquiry,
  type CloudinaryConfig,
} from '../utils/localDB'
import type { Photo, PhotoCategory } from '../types/photo'
import { SiteSettings } from '../data/settings'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [inquiries, setInquiries] = useState<LocalInquiry[]>([])

  // UI state
  const [activeTab, setActiveTab] = useState<'gallery' | 'settings' | 'json' | 'inquiries'>('gallery')
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Cloudinary credentials state
  const [cloudinaryConfig, setCloudinaryConfig] = useState<CloudinaryConfig>({
    cloudName: '',
    uploadPreset: '',
    apiKey: '',
    apiSecret: '',
  })

  // Selected file for upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Photo form state
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    src: '', // Used for manual URL fallback
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

  useEffect(() => {
    // Load local storage values
    const allSettings = getLocalSettings()
    const allInquiries = getLocalInquiries()
    const cConfig = getCloudinaryConfig()

    setInquiries(allInquiries)
    setSettingsForm(allSettings)

    if (cConfig) {
      setCloudinaryConfig(cConfig)
    }

    refreshPhotos()
  }, [])

  const refreshPhotos = async () => {
    setIsRefreshing(true)
    try {
      const allPhotos = await getDynamicPhotos()
      setPhotos(allPhotos)
      setJsonText(JSON.stringify(allPhotos, null, 2))
    } catch (e) {
      console.error('[Dashboard] Failed to refresh photos:', e)
    } finally {
      setIsRefreshing(false)
    }
  }

  const triggerNotification = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleLogout = () => {
    console.log('[Logout] Clearing admin access state...')
    localStorage.setItem('is_admin', 'false')
    navigate('/')
  }

  // --- ADD / UPLOAD PHOTO ---
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault()

    const hasCloud = cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset

    if (hasCloud) {
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
        // 1. Serialize metadata to a base64 string
        const base64Metadata = serializeMetadata({
          title: newPhoto.title,
          category: newPhoto.category,
          camera: newPhoto.camera,
          location: newPhoto.location,
          date: newPhoto.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          aspect: newPhoto.aspect,
          featured: newPhoto.featured,
          description: newPhoto.description,
        })

        // 2. Set Public ID to: cis_gallery/[base64_metadata]
        const publicId = `cis_gallery/${base64Metadata}`

        // 3. Assemble FormData for Cloudinary Unsigned Upload
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('upload_preset', cloudinaryConfig.uploadPreset)
        formData.append('public_id', publicId)
        formData.append('tags', 'cis_gallery')

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`

        console.log('[Cloudinary Upload] Initiating request to:', uploadUrl)
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error?.message || `Cloudinary response error: ${response.status}`)
        }

        const data = await response.json()
        console.log('[Cloudinary Upload] Success!', data)

        setUploadStatus('success')
        setSelectedFile(null)
        
        // Reset form
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

        // Clear the file input element manually
        const fileInput = document.getElementById('photo-file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''

        triggerNotification('Photograph uploaded successfully to Cloudinary CDN.')
        window.dispatchEvent(new Event('gallery_updated'))
        await refreshPhotos()
      } catch (err: any) {
        console.error('[Cloudinary Upload Error]', err)
        setUploadStatus('error')
        setUploadError(err.message || 'Direct upload request failed.')
      }
    } else {
      // Offline mode fallback (requires manual image URL)
      if (!newPhoto.title || !newPhoto.src) {
        alert('Title and Image URL are required in offline fallback mode.')
        return
      }

      const created: Photo = {
        id: 'local_' + Math.random().toString(36).substring(2, 9),
        slug: newPhoto.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        title: newPhoto.title,
        src: newPhoto.src,
        displayUrl: newPhoto.src,
        category: newPhoto.category,
        location: newPhoto.location,
        camera: newPhoto.camera,
        lens: newPhoto.lens,
        date: newPhoto.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        aspect: newPhoto.aspect,
        featured: newPhoto.featured,
        alt: newPhoto.alt || newPhoto.title,
        description: newPhoto.description,
        likes: 0,
        views: 0,
      }

      const updated = [created, ...photos]
      setPhotos(updated)
      saveLocalPhotos(updated)
      setJsonText(JSON.stringify(updated, null, 2))

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

      window.dispatchEvent(new Event('gallery_updated'))
      triggerNotification('Photograph committed to local storage cache.')
    }
  }

  // --- DELETE PHOTO ---
  const handleDeletePhoto = async (photo: Photo) => {
    const isCloudinaryPhoto = photo.id.startsWith('cis_gallery/')
    const hasCloudCredentials = cloudinaryConfig.cloudName && cloudinaryConfig.apiKey && cloudinaryConfig.apiSecret

    if (isCloudinaryPhoto && !hasCloudCredentials) {
      alert('To delete images from Cloudinary, you must configure API Key and API Secret under Settings.')
      return
    }

    if (!window.confirm(`Delete "${photo.title}" permanently?`)) return

    if (isCloudinaryPhoto && hasCloudCredentials) {
      triggerNotification('Sending destroy request to Cloudinary...')
      try {
        const timestamp = Math.round(Date.now() / 1000).toString()
        const params = {
          public_id: photo.id,
          timestamp: timestamp,
        }

        // Generate SHA-1 signature using native web crypto
        const signature = await generateCloudinarySignature(params, cloudinaryConfig.apiSecret)

        const formData = new FormData()
        formData.append('public_id', photo.id)
        formData.append('timestamp', timestamp)
        formData.append('api_key', cloudinaryConfig.apiKey)
        formData.append('signature', signature)

        const deleteUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/destroy`

        console.log('[Cloudinary Delete] Initiating request to:', deleteUrl)
        const response = await fetch(deleteUrl, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error?.message || 'Cloudinary deletion request failed.')
        }

        const resData = await response.json()
        console.log('[Cloudinary Delete] Response:', resData)

        if (resData.result === 'not found') {
          console.warn('[Cloudinary Delete] Resource not found on server, clearing locally.')
        }

        // Clean up view count states from local cache
        const localCached = getLocalPhotos().filter((p) => p.id !== photo.id)
        saveLocalPhotos(localCached)

        triggerNotification('Photograph removed from Cloudinary server.')
        window.dispatchEvent(new Event('gallery_updated'))
        await refreshPhotos()
      } catch (err: any) {
        alert(`Cloudinary Deletion Failed: ${err.message}`)
      }
    } else {
      // Local fallback removal
      const updated = photos.filter((p) => p.id !== photo.id)
      setPhotos(updated)
      saveLocalPhotos(updated)
      setJsonText(JSON.stringify(updated, null, 2))
      window.dispatchEvent(new Event('gallery_updated'))
      triggerNotification('Photograph cleared from local storage cache.')
    }
  }

  // --- START EDITING ---
  const startEditing = (photo: Photo) => {
    setEditingPhotoId(photo.id)
    setEditForm({
      id: photo.id,
      title: photo.title,
      category: photo.category,
      location: photo.location || '',
      camera: photo.camera || '',
      lens: photo.lens || '',
      date: photo.date || '',
      aspect: photo.aspect,
      featured: photo.featured,
      alt: photo.alt || '',
      description: photo.description || '',
      src: photo.src,
    })
  }

  // --- SAVE EDIT (RENAME IN CLOUDINARY OR UPDATE LOCAL) ---
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm) return

    const isCloudinaryPhoto = editForm.id.startsWith('cis_gallery/')
    const hasCloudCredentials = cloudinaryConfig.cloudName && cloudinaryConfig.apiKey && cloudinaryConfig.apiSecret

    if (isCloudinaryPhoto && !hasCloudCredentials) {
      alert('To modify Cloudinary metadata, you must enter your Cloudinary API Key and API Secret in the Settings tab.')
      return
    }

    if (isCloudinaryPhoto && hasCloudCredentials) {
      triggerNotification('Synchronizing updates with Cloudinary CDN...')
      try {
        const newBase64 = serializeMetadata({
          title: editForm.title,
          category: editForm.category,
          camera: editForm.camera,
          location: editForm.location,
          date: editForm.date,
          aspect: editForm.aspect,
          featured: editForm.featured,
          description: editForm.description,
        })

        const newPublicId = `cis_gallery/${newBase64}`

        if (editForm.id === newPublicId) {
          // No changes made to metadata
          setEditingPhotoId(null)
          setEditForm(null)
          return
        }

        const timestamp = Math.round(Date.now() / 1000).toString()
        const params = {
          from_public_id: editForm.id,
          timestamp: timestamp,
          to_public_id: newPublicId,
        }

        const signature = await generateCloudinarySignature(params, cloudinaryConfig.apiSecret)

        const formData = new FormData()
        formData.append('from_public_id', editForm.id)
        formData.append('to_public_id', newPublicId)
        formData.append('timestamp', timestamp)
        formData.append('api_key', cloudinaryConfig.apiKey)
        formData.append('signature', signature)

        const renameUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/rename`
        console.log('[Cloudinary Rename] Initiating request to:', renameUrl)

        const response = await fetch(renameUrl, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error?.message || 'Renaming request rejected.')
        }

        // Migrate local metadata for view counters
        const local = getLocalPhotos()
        const matchIdx = local.findIndex((p) => p.id === editForm.id)
        if (matchIdx !== -1) {
          const target = local[matchIdx]
          local[matchIdx] = {
            ...target,
            id: newPublicId,
            title: editForm.title,
            category: editForm.category,
            location: editForm.location,
            camera: editForm.camera,
            date: editForm.date,
            aspect: editForm.aspect,
            featured: editForm.featured,
            description: editForm.description,
          }
          saveLocalPhotos(local)
        }

        setEditingPhotoId(null)
        setEditForm(null)
        triggerNotification('Cloudinary metadata updated.')
        window.dispatchEvent(new Event('gallery_updated'))
        await refreshPhotos()
      } catch (err: any) {
        alert(`Cloudinary Edit Failed: ${err.message}`)
      }
    } else {
      // Local fallback edit
      const updated = photos.map((p) => {
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
      setPhotos(updated)
      saveLocalPhotos(updated)
      setJsonText(JSON.stringify(updated, null, 2))
      setEditingPhotoId(null)
      setEditForm(null)
      window.dispatchEvent(new Event('gallery_updated'))
      triggerNotification('Local photograph cache updated.')
    }
  }

  // --- SAVE SYSTEM SETTINGS AND CLOUDINARY CONFIG ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Save general settings
    saveLocalSettings(settingsForm)

    // Save Cloudinary configuration
    saveCloudinaryConfig(cloudinaryConfig)

    window.dispatchEvent(new Event('gallery_updated'))
    triggerNotification('Configuration parameters synchronized.')
    refreshPhotos()
  }

  const handleSaveJson = () => {
    setJsonError(null)
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) {
        throw new Error('Root element must be a JSON Array of Photos.')
      }
      saveLocalPhotos(parsed)
      setPhotos(parsed)
      window.dispatchEvent(new Event('gallery_updated'))
      triggerNotification('Raw JSON saved and synchronized successfully.')
    } catch (err: any) {
      setJsonError(err?.message || 'Invalid JSON syntax.')
    }
  }

  const handleDeleteInquiry = (id: string) => {
    if (!window.confirm('Remove this message from inbox?')) return
    const current = getLocalInquiries()
    const updated = current.filter((inq) => inq._id !== id)
    localStorage.setItem('gallery_inquiries', JSON.stringify(updated))
    setInquiries(updated)
    triggerNotification('Inquiry message removed.')
  }

  const isCloudinarySetup = Boolean(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset)

  return (
    <div className="min-h-screen bg-charcoal text-cream font-body selection:bg-gold selection:text-charcoal relative pb-16">
      {/* Decorative Blur Ambient */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header bar */}
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
            onClick={refreshPhotos}
            disabled={isRefreshing}
            className="cursor-hover border border-gold/20 hover:border-gold bg-gold/5 text-gold px-4 py-2 text-[10px] tracking-widest uppercase transition-all rounded-sm font-semibold disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing list...' : 'Sync Cloudinary'}
          </button>
          
          <button
            onClick={handleLogout}
            className="cursor-hover border border-white/15 hover:border-red-400/50 hover:text-red-400 bg-transparent px-5 py-2 text-[10px] tracking-widest uppercase transition-all rounded-sm font-medium"
          >
            Exit Control Room
          </button>
        </div>
      </header>

      {/* Success Notification */}
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
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-8 mb-10 overflow-x-auto pb-1 scrollbar-thin">
          {[
            { id: 'gallery', label: 'Gallery Manager' },
            { id: 'settings', label: 'Settings & Cloudinary' },
            { id: 'json', label: 'Raw JSON View' },
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

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === 'gallery' && (
            <motion.div
              key="gallery-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-10"
            >
              {/* Add form */}
              <div className="lg:col-span-1 border border-white/10 p-6 md:p-8 bg-charcoal-light/20 backdrop-blur-sm rounded-sm">
                <span className="font-body text-[10px] tracking-[0.3em] text-gold uppercase block mb-2">
                  {isCloudinarySetup ? 'Cloudinary CDN upload' : 'Local Fallback Mode'}
                </span>
                <h3 className="font-display text-xl text-cream uppercase mb-6">
                  {isCloudinarySetup ? 'Direct File Upload' : 'Add Image URL'}
                </h3>

                <form onSubmit={handleAddPhoto} className="space-y-5">
                  {isCloudinarySetup ? (
                    <div className="space-y-2 border border-dashed border-white/10 p-4 bg-black/10 rounded-sm">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase cursor-pointer">
                        Select Image File from Laptop
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
                          File Ready: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                        Image URL (Seed Fallback Mode)
                      </label>
                      <input
                        type="url"
                        required
                        value={newPhoto.src}
                        onChange={(e) => setNewPhoto({ ...newPhoto, src: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-charcoal border border-white/10 p-3 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                      />
                      <p className="text-[9px] text-yellow-500/80 italic tracking-wider mt-1">
                        Notice: To browse and upload image files directly from your laptop, configure Cloudinary in the Settings tab.
                      </p>
                    </div>
                  )}

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
                        Uploading to Cloudinary CDN...
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
                    {isCloudinarySetup ? 'Upload File from Laptop' : 'Commit Offline URL'}
                  </button>
                </form>
              </div>

              {/* Photos List Manager */}
              <div className="lg:col-span-2 space-y-6">
                <div className="border border-white/10 p-6 md:p-8 bg-charcoal-light/10 backdrop-blur-sm rounded-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-display text-xl text-cream uppercase">Photographs Archive</h3>
                      <p className="text-cream-muted text-xs font-body mt-1">
                        {isCloudinarySetup
                          ? `Displaying ${photos.length} photos loaded from Cloudinary CDN.`
                          : `Displaying ${photos.length} photos in Offline Mode.`}
                      </p>
                    </div>
                    <button
                      onClick={refreshPhotos}
                      disabled={isRefreshing}
                      className="text-xs font-body text-gold hover:underline uppercase tracking-wider disabled:opacity-50"
                    >
                      {isRefreshing ? 'Syncing...' : '↻ Refresh list'}
                    </button>
                  </div>

                  {/* Inline edit panel modal */}
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
                              className="w-full bg-charcoal border border-white/10 p-2 text-xs text-cream focus:outline-none resize-none"
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

                  <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                    {photos.length === 0 ? (
                      <p className="text-cream-muted text-sm italic font-body py-8 text-center">
                        Archive is empty. Upload files from your laptop to begin.
                      </p>
                    ) : (
                      photos.map((p) => {
                        const isCloudinary = p.id.startsWith('cis_gallery/')
                        return (
                          <div
                            key={p.id}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-white/5 bg-charcoal/40 p-4 hover:border-gold/15 transition-all gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <img
                                src={p.src}
                                alt={p.title}
                                className="w-14 h-14 object-cover border border-white/10 rounded-sm"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&q=80'
                                }}
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-heading text-sm text-cream font-medium">{p.title}</h4>
                                  <span className={`text-[8px] font-semibold tracking-wider px-1.5 py-0.5 rounded-sm uppercase ${
                                    isCloudinary ? 'border border-gold/30 text-gold' : 'border border-white/10 text-cream-muted'
                                  }`}>
                                    {isCloudinary ? 'Cloudinary CDN' : 'Offline Seed'}
                                  </span>
                                </div>
                                <p className="font-body text-[10px] text-cream-muted uppercase tracking-wider mt-1">
                                  {p.category} · {p.location || 'No Location'} · {p.aspect}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                              {/* Edit Button */}
                              <button
                                onClick={() => startEditing(p)}
                                className="px-3 py-1.5 text-[10px] tracking-widest uppercase border border-white/10 text-cream-muted hover:border-gold/30 hover:text-gold transition-colors rounded-sm"
                              >
                                Edit
                              </button>

                              {/* Toggle Featured Indicator */}
                              {p.featured && (
                                <span className="px-2 py-1 text-[8px] bg-gold/10 border border-gold/30 text-gold font-bold uppercase tracking-wider rounded-sm">
                                  Hero Loop
                                </span>
                              )}

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeletePhoto(p)}
                                className="px-3 py-1.5 text-[10px] tracking-widest uppercase border border-red-500/10 text-red-400/80 hover:bg-red-500/10 hover:border-red-500/50 transition-colors rounded-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
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
              {/* Cloudinary Config Form */}
              <div className="border border-gold/20 p-6 md:p-10 bg-charcoal-light/10 backdrop-blur-sm rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body text-[10px] tracking-[0.3em] text-gold uppercase block">
                    Cloud Image Storage Integration
                  </span>
                  <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 border rounded-sm ${
                    isCloudinarySetup ? 'border-gold text-gold bg-gold/5' : 'border-red-500/40 text-red-400'
                  }`}>
                    {isCloudinarySetup ? 'CDN Active' : 'Off-Grid Mode'}
                  </span>
                </div>
                <h3 className="font-display text-2xl text-cream uppercase mb-6">Cloudinary Integration Console</h3>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                        Cloud Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={cloudinaryConfig.cloudName}
                        onChange={(e) => setCloudinaryConfig({ ...cloudinaryConfig, cloudName: e.target.value })}
                        placeholder="your-cloud-name"
                        className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                        Unsigned Upload Preset Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={cloudinaryConfig.uploadPreset}
                        onChange={(e) => setCloudinaryConfig({ ...cloudinaryConfig, uploadPreset: e.target.value })}
                        placeholder="your-unsigned-preset"
                        className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                        API Key (Required for Delete/Rename)
                      </label>
                      <input
                        type="text"
                        value={cloudinaryConfig.apiKey}
                        onChange={(e) => setCloudinaryConfig({ ...cloudinaryConfig, apiKey: e.target.value })}
                        placeholder="your-api-key"
                        className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-body text-[10px] tracking-widest text-cream-muted uppercase">
                        API Secret (Stored locally only)
                      </label>
                      <input
                        type="password"
                        value={cloudinaryConfig.apiSecret}
                        onChange={(e) => setCloudinaryConfig({ ...cloudinaryConfig, apiSecret: e.target.value })}
                        placeholder="••••••••••••••••"
                        className="w-full bg-charcoal border border-white/10 p-3.5 text-sm text-cream focus:outline-none focus:border-gold/45 rounded-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-cream-muted/70 bg-black/25 p-4 border border-white/5 space-y-2 rounded-sm font-body">
                    <p className="font-bold text-gold uppercase tracking-wider">Required Cloudinary Dashboard Setup:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Log in to your Cloudinary console.</li>
                      <li>Go to **Settings (gear icon) ➔ Upload**. Scroll to **Upload presets** and click **Add upload preset**.</li>
                      <li>Set Mode to **Unsigned**, name it, and set the Folder parameter to **cis_gallery**. Click Save.</li>
                      <li>Go to **Settings ➔ Security**. Locate **Restricted media types** and verify that **Resource list** is **Checked (Enabled)**. This allows the website to fetch your image directory dynamically.</li>
                    </ol>
                  </div>

                  {/* General settings submit nested */}
                  <div className="border-t border-white/10 pt-6">
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
                    Synchronize Configuration & Reload
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
