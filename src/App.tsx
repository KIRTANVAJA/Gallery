import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

import { GrainOverlay } from './components/effects/GrainOverlay'
import { LoadingScreen } from './components/effects/LoadingScreen'
import { ParticleField } from './components/effects/ParticleField'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminLoginModal } from './components/admin/AdminLoginModal'
import { MoodSelector } from './components/effects/MoodSelector'
import { HomePage } from './pages/HomePage'
import { PhotoPage } from './pages/PhotoPage'
import { useAmbientMusic } from './hooks/useAmbientMusic'
import { useImageProtection } from './hooks/useImageProtection'
import { useTheme } from './hooks/useTheme'
import { useAdminAccess } from './context/AdminAccessContext'

import { initPersistentStorage } from './utils/localDB'

function App() {
  const [loading, setLoading] = useState(true)
  const { theme, toggleTheme, isDark } = useTheme()
  const { playing, toggleMusic } = useAmbientMusic()
  const { showLoginModal, setShowLoginModal, holdProgress } = useAdminAccess()
  useImageProtection()

  useEffect(() => {
    // Load and restore persistent data from IndexedDB into localStorage on load
    initPersistentStorage()
      .then(() => {
        setTimeout(() => setLoading(false), 2000)
      })
      .catch((err) => {
        console.error('Storage initialization failed:', err)
        setLoading(false)
      })
  }, [])

  return (
    <BrowserRouter>
      <LoadingScreen visible={loading} />

      <GrainOverlay />
      <ParticleField />

      {/* Cinematic Background Blur Overlay for Logo Hold */}
      <div
        className="fixed inset-0 z-40 bg-black/60 pointer-events-none transition-all duration-300"
        style={{
          backdropFilter: `blur(${holdProgress * 8}px)`,
          opacity: holdProgress > 0 ? 1 : 0,
        }}
      />

      {/* Hidden Admin Login Modal */}
      <AdminLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Atmospheric Mood Selector */}
      <MoodSelector />

      <div className={`relative min-h-screen bg-[var(--bg-primary)] ${loading ? 'overflow-hidden h-screen' : ''}`}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10002] focus:bg-gold focus:px-4 focus:py-2 focus:text-charcoal focus:font-body focus:text-xs focus:tracking-widest focus:uppercase"
                >
                  Skip to content
                </a>
                <main id="main-content">
                  <HomePage
                    onToggleTheme={toggleTheme}
                    isDark={isDark}
                    onToggleMusic={toggleMusic}
                    musicPlaying={playing}
                  />
                </main>
              </>
            }
          />
          <Route path="/photo/:slug" element={<PhotoPage />} />
          <Route
            path="/hidden-admin-dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      <span className="sr-only">Current theme: {theme}</span>
    </BrowserRouter>
  )
}

export default App
