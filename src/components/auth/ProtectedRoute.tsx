import { type ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading')

  useEffect(() => {
    const isAdmin = localStorage.getItem('is_admin') === 'true'
    console.log('[Protected Route Validation] Checking local admin authentication state:', isAdmin ? 'Authenticated' : 'Denied')
    if (isAdmin) {
      setStatus('ok')
    } else {
      console.log('[Protected Route Validation] Unauthorized access attempt, redirecting to homepage.')
      setStatus('denied')
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <p className="text-cream-muted text-sm">Verifying...</p>
      </div>
    )
  }

  if (status === 'denied') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
