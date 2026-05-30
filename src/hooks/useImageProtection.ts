import { useEffect } from 'react'

export function useImageProtection() {
  useEffect(() => {
    const blockContext = (e: MouseEvent) => e.preventDefault()
    const blockDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', blockContext)
    document.addEventListener('dragstart', blockDrag)

    return () => {
      document.removeEventListener('contextmenu', blockContext)
      document.removeEventListener('dragstart', blockDrag)
    }
  }, [])
}
