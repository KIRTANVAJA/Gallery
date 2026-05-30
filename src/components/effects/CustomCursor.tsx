import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

export function CustomCursor() {
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const [visible, setVisible] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [isTouch, setIsTouch] = useState(true)

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  const springConfig = { damping: 28, stiffness: 280, mass: 0.5 }
  const dotX = useSpring(cursorX, springConfig)
  const dotY = useSpring(cursorY, springConfig)
  const ringX = useSpring(cursorX, { ...springConfig, damping: 35 })
  const ringY = useSpring(cursorY, { ...springConfig, damping: 35 })

  useEffect(() => {
    if (isTouch) return

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      setVisible(true)
    }

    const hide = () => setVisible(false)
    const show = () => setVisible(true)

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      setHovering(
        !!target.closest('a, button, [role="button"], .cursor-hover'),
      )
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mousemove', onOver)
    window.addEventListener('mouseleave', hide)
    window.addEventListener('mouseenter', show)

    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mousemove', onOver)
      window.removeEventListener('mouseleave', hide)
      window.removeEventListener('mouseenter', show)
    }
  }, [cursorX, cursorY, isTouch])

  if (isTouch) return null

  return (
    <>
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[10000] mix-blend-difference hidden md:block"
        style={{ x: dotX, y: dotY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: hovering ? 0.5 : 1,
        }}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-cream" />
      </motion.div>
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          opacity: visible ? 1 : 0,
          width: hovering ? 56 : 36,
          height: hovering ? 56 : 36,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div
          className="h-full w-full rounded-full border border-gold/40"
          style={{
            boxShadow: '0 0 24px rgba(201, 169, 98, 0.25)',
          }}
        />
      </motion.div>
    </>
  )
}
