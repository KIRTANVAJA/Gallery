import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

interface AdminAccessContextType {
  isHolding: boolean
  holdProgress: number // 0 to 1
  showLoginModal: boolean
  setShowLoginModal: (show: boolean) => void
  startHolding: () => void
  stopHolding: () => void
  resetHold: () => void
}

const AdminAccessContext = createContext<AdminAccessContextType | undefined>(undefined)

export function AdminAccessProvider({ children }: { children: React.ReactNode }) {
  const [isHolding, setIsHolding] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  const startTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const decayFrameRef = useRef<number | null>(null)

  const HOLD_DURATION = 4000 // 4 seconds

  const startHolding = () => {
    if (showLoginModal) return
    
    // Cancel any ongoing decay
    if (decayFrameRef.current) {
      cancelAnimationFrame(decayFrameRef.current)
      decayFrameRef.current = null
    }

    setIsHolding(true)
    startTimeRef.current = performance.now() - (holdProgress * HOLD_DURATION)

    const tick = (now: number) => {
      if (!startTimeRef.current) return
      
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / HOLD_DURATION, 1)
      
      setHoldProgress(progress)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick)
      } else {
        // Successful hold!
        setIsHolding(false)
        setHoldProgress(0)
        startTimeRef.current = null
        
        // Haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 200])
        }
        
        setShowLoginModal(true)
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick)
  }

  const stopHolding = () => {
    setIsHolding(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    startTimeRef.current = null

    // Smoothly decay progress back to 0
    const decay = () => {
      setHoldProgress((prev) => {
        const next = prev - 0.05 // Decrease by 5% per frame
        if (next <= 0) {
          if (decayFrameRef.current) {
            cancelAnimationFrame(decayFrameRef.current)
            decayFrameRef.current = null
          }
          return 0
        }
        decayFrameRef.current = requestAnimationFrame(decay)
        return next
      })
    }

    decayFrameRef.current = requestAnimationFrame(decay)
  }

  const resetHold = () => {
    setIsHolding(false)
    setHoldProgress(0)
    startTimeRef.current = null
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    if (decayFrameRef.current) cancelAnimationFrame(decayFrameRef.current)
  }

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (decayFrameRef.current) cancelAnimationFrame(decayFrameRef.current)
    }
  }, [])

  return (
    <AdminAccessContext.Provider
      value={{
        isHolding,
        holdProgress,
        showLoginModal,
        setShowLoginModal,
        startHolding,
        stopHolding,
        resetHold,
      }}
    >
      {children}
    </AdminAccessContext.Provider>
  )
}

export function useAdminAccess() {
  const context = useContext(AdminAccessContext)
  if (!context) {
    throw new Error('useAdminAccess must be used within an AdminAccessProvider')
  }
  return context
}
