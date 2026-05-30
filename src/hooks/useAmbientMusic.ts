import { useCallback, useRef, useState } from 'react'

export function useAmbientMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  const toggleMusic = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(
        'https://cdn.pixabay.com/audio/2022/10/25/audio_946f77464d.mp3',
      )
      audioRef.current.loop = true
      audioRef.current.volume = 0.25
    }

    const audio = audioRef.current

    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      try {
        await audio.play()
        setPlaying(true)
      } catch {
        setPlaying(false)
      }
    }
  }, [playing])

  return { playing, toggleMusic }
}
