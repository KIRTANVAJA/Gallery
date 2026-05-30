import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

// Custom Vite plugin for Local Photography CMS
function localCmsPlugin() {
  return {
    name: 'local-cms-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api/local-')) {
          res.setHeader('Content-Type', 'application/json')
          
          let body = ''
          req.on('data', (chunk: any) => {
            body += chunk
          })
          
          req.on('end', () => {
            try {
              const data = body ? JSON.parse(body) : {}
              
              if (req.url === '/api/local-upload') {
                const { title, category, filename, fileData, aspect, location, camera, date, description } = data
                if (!filename || !fileData) {
                  res.statusCode = 400
                  res.end(JSON.stringify({ error: 'Missing filename or fileData' }))
                  return
                }
                
                // Decode base64
                const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '')
                const buffer = Buffer.from(base64Data, 'base64')
                
                // Ensure directories exist
                const assetsDir = path.resolve(__dirname, 'src/assets/photos')
                const publicDir = path.resolve(__dirname, 'public/assets/photos')
                if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true })
                if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
                
                // Write file to both folders
                fs.writeFileSync(path.join(assetsDir, filename), buffer)
                fs.writeFileSync(path.join(publicDir, filename), buffer)
                
                // Load and update gallery.json
                const jsonPath = path.resolve(__dirname, 'src/data/gallery.json')
                let galleryList = []
                if (fs.existsSync(jsonPath)) {
                  galleryList = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
                }
                
                const newId = galleryList.length > 0 
                  ? Math.max(...galleryList.map((i: any) => Number(i.id) || 0)) + 1 
                  : 1
                
                const newEntry = {
                  id: newId,
                  title: title || filename.split('.')[0],
                  category: category || 'Cinematic',
                  image: `/assets/photos/${filename}`,
                  aspect: aspect || 'wide',
                  location: location || '',
                  camera: camera || '',
                  date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                  description: description || '',
                  featured: false,
                  likes: 0,
                  views: 0,
                  commentCount: 0
                }
                
                galleryList.unshift(newEntry)
                fs.writeFileSync(jsonPath, JSON.stringify(galleryList, null, 2))
                
                res.end(JSON.stringify({ success: true, item: newEntry }))
                return
              }
              
              if (req.url === '/api/local-update') {
                const { id, fields } = data
                const jsonPath = path.resolve(__dirname, 'src/data/gallery.json')
                if (!fs.existsSync(jsonPath)) {
                  res.statusCode = 404
                  res.end(JSON.stringify({ error: 'gallery.json not found' }))
                  return
                }
                
                let galleryList = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
                galleryList = galleryList.map((item: any) => {
                  if (String(item.id) === String(id)) {
                    return { ...item, ...fields }
                  }
                  return item
                })
                
                fs.writeFileSync(jsonPath, JSON.stringify(galleryList, null, 2))
                res.end(JSON.stringify({ success: true }))
                return
              }
              
              if (req.url === '/api/local-delete') {
                const { id } = data
                const jsonPath = path.resolve(__dirname, 'src/data/gallery.json')
                if (!fs.existsSync(jsonPath)) {
                  res.statusCode = 404
                  res.end(JSON.stringify({ error: 'gallery.json not found' }))
                  return
                }
                
                let galleryList = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
                const item = galleryList.find((i: any) => String(i.id) === String(id))
                if (item && item.image) {
                  const filename = path.basename(item.image)
                  const assetsFile = path.resolve(__dirname, 'src/assets/photos', filename)
                  const publicFile = path.resolve(__dirname, 'public/assets/photos', filename)
                  
                  if (fs.existsSync(assetsFile)) fs.unlinkSync(assetsFile)
                  if (fs.existsSync(publicFile)) fs.unlinkSync(publicFile)
                }
                
                galleryList = galleryList.filter((i: any) => String(i.id) !== String(id))
                fs.writeFileSync(jsonPath, JSON.stringify(galleryList, null, 2))
                res.end(JSON.stringify({ success: true }))
                return
              }
              
              if (req.url === '/api/local-reorder') {
                const { reorderedList } = data
                const jsonPath = path.resolve(__dirname, 'src/data/gallery.json')
                if (!fs.existsSync(jsonPath)) {
                  res.statusCode = 404
                  res.end(JSON.stringify({ error: 'gallery.json not found' }))
                  return
                }
                
                const galleryList = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
                const ordered: any[] = []
                reorderedList.forEach((id: any) => {
                  const item = galleryList.find((i: any) => String(i.id) === String(id))
                  if (item) ordered.push(item)
                })
                
                galleryList.forEach((item: any) => {
                  if (!ordered.some((o: any) => String(o.id) === String(item.id))) {
                    ordered.push(item)
                  }
                })
                
                fs.writeFileSync(jsonPath, JSON.stringify(ordered, null, 2))
                res.end(JSON.stringify({ success: true }))
                return
              }
              
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Endpoint not found' }))
            } catch (err: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    localCmsPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Capture in Silences',
        short_name: 'Silences',
        description: 'Cinematic photography portfolio',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
      },
    }),
  ],
})
