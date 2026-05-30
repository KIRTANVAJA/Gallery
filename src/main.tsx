import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { AdminAccessProvider } from './context/AdminAccessContext'
import { MoodProvider } from './context/MoodContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <AdminAccessProvider>
        <MoodProvider>
          <App />
        </MoodProvider>
      </AdminAccessProvider>
    </HelmetProvider>
  </StrictMode>,
)
