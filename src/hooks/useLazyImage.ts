import { useEffect, useRef, useState } from 'react'

export function useLazyImage(src: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px', threshold: 0.01 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setLoaded(false)
  }, [src])

  useEffect(() => {
    if (!inView) return

    const img = new Image()
    img.src = src
    img.onload = () => setLoaded(true)
  }, [inView, src])

  return { ref, loaded, inView }
}
