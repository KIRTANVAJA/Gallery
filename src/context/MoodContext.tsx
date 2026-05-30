import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

export type MoodType =
  | 'cinematic'
  | 'rainy-nights'
  | 'golden-hour'
  | 'nostalgic'
  | 'lonely'
  | 'dreamy'
  | 'peaceful'
  | 'monochrome'

interface MoodContextType {
  mood: MoodType
  setMood: (mood: MoodType) => void
  soundPlaying: boolean
  setSoundPlaying: (playing: boolean) => void
  volume: number
  setVolume: (volume: number) => void
}

const MoodContext = createContext<MoodContextType | undefined>(undefined)

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMoodState] = useState<MoodType>('cinematic')
  const [soundPlaying, setSoundPlaying] = useState(false)
  const [volume, setVolume] = useState(0.4)

  // Web Audio Refs for synthesis
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const synthNodesRef = useRef<any[]>([])

  const setMood = (newMood: MoodType) => {
    setMoodState(newMood)
    // Update body class for CSS filters/colors
    if (typeof document !== 'undefined') {
      const body = document.body
      body.classList.forEach((cls) => {
        if (cls.startsWith('mood-')) body.classList.remove(cls)
      })
      body.classList.add(`mood-${newMood}`)
    }
  }

  // Initialize Web Audio API
  const initAudio = () => {
    if (audioCtxRef.current) return
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return

    const ctx = new AudioCtx()
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(volume, ctx.currentTime)
    masterGain.connect(ctx.destination)

    audioCtxRef.current = ctx
    masterGainRef.current = masterGain
  }

  // Clean up all running synths
  const stopSynthesis = () => {
    synthNodesRef.current.forEach((node) => {
      try {
        node.stop()
      } catch {}
      try {
        node.disconnect()
      } catch {}
    })
    synthNodesRef.current = []
  }

  // Start sound synthesis based on mood
  const startSynthesis = () => {
    if (!audioCtxRef.current || !masterGainRef.current) return
    const ctx = audioCtxRef.current
    const dest = masterGainRef.current

    stopSynthesis()

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    if (mood === 'rainy-nights') {
      // 1. Generate Rain Ambience (White Noise + Bandpass Filter)
      const bufferSize = 2 * ctx.sampleRate
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }

      const whiteNoise = ctx.createBufferSource()
      whiteNoise.buffer = noiseBuffer
      whiteNoise.loop = true

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800

      const rainGain = ctx.createGain()
      rainGain.gain.value = 0.6

      whiteNoise.connect(filter)
      filter.connect(rainGain)
      rainGain.connect(dest)
      whiteNoise.start()

      synthNodesRef.current.push(whiteNoise)

      // 2. Slow soft chord synth (piano-like drone)
      const freqs = [130.81, 164.81, 196.00, 246.94] // C3, E3, G3, B3
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = f
        
        g.gain.setValueAtTime(0, ctx.currentTime)
        // Modulate volume slowly to simulate slow piano swells
        g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 3 + idx)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 8 + idx)

        osc.connect(g)
        g.connect(dest)
        osc.start()
        
        // Loop the swell
        const interval = setInterval(() => {
          if (!soundPlaying || mood !== 'rainy-nights') {
            clearInterval(interval)
            return
          }
          g.gain.cancelScheduledValues(ctx.currentTime)
          g.gain.setValueAtTime(0, ctx.currentTime)
          g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 3 + idx)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 8 + idx)
        }, 12000)

        synthNodesRef.current.push(osc)
      })

    } else if (mood === 'golden-hour') {
      // Warm synth chord pad (Major 7th chord in D)
      const freqs = [146.83, 185.00, 220.00, 277.18] // D3, F#3, A3, C#4
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        const filter = ctx.createBiquadFilter()
        const g = ctx.createGain()

        osc.type = 'triangle'
        osc.frequency.value = f

        filter.type = 'lowpass'
        filter.frequency.value = 400

        g.gain.setValueAtTime(0, ctx.currentTime)
        g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 4 + idx)
        g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 10 + idx)

        osc.connect(filter)
        filter.connect(g)
        g.connect(dest)
        osc.start()

        const interval = setInterval(() => {
          if (!soundPlaying || mood !== 'golden-hour') {
            clearInterval(interval)
            return
          }
          g.gain.cancelScheduledValues(ctx.currentTime)
          g.gain.setValueAtTime(0.01, ctx.currentTime)
          g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 4 + idx)
          g.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 10 + idx)
        }, 14000)

        synthNodesRef.current.push(osc)
      })

    } else if (mood === 'nostalgic') {
      // Crackling Vinyl (White Noise with random spikes + lowpass)
      const scriptNode = ctx.createScriptProcessor(4096, 0, 1)
      scriptNode.onaudioprocess = (e) => {
        const outputBuffer = e.outputBuffer.getChannelData(0)
        for (let i = 0; i < outputBuffer.length; i++) {
          let crackle = 0
          if (Math.random() < 0.0003) {
            crackle = Math.random() * 2 - 1 // click pop
          }
          // background hiss
          outputBuffer[i] = crackle + (Math.random() * 0.02 - 0.01)
        }
      }

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1000
      filter.Q.value = 1.0

      const crackleGain = ctx.createGain()
      crackleGain.gain.value = 0.25

      scriptNode.connect(filter)
      filter.connect(crackleGain)
      crackleGain.connect(dest)

      // Add a soft classical piano note synthesis (E3, G#3, B3)
      const freqs = [164.81, 207.65, 246.94]
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = f
        g.gain.setValueAtTime(0, ctx.currentTime)
        g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 1)
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 5 + idx)

        osc.connect(g)
        g.connect(dest)
        osc.start()

        const interval = setInterval(() => {
          if (!soundPlaying || mood !== 'nostalgic') {
            clearInterval(interval)
            return
          }
          g.gain.setValueAtTime(0, ctx.currentTime)
          g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 1)
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 5 + idx)
        }, 8000)

        synthNodesRef.current.push(osc)
      })

      synthNodesRef.current.push(scriptNode)
    } else {
      // Default / Cinematic: Deep low-frequency drone (F2, C3)
      const droneFreqs = [87.31, 130.81]
      droneFreqs.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = f

        g.gain.setValueAtTime(0, ctx.currentTime)
        g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 4)
        g.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 8 + idx)

        osc.connect(g)
        g.connect(dest)
        osc.start()

        const interval = setInterval(() => {
          if (!soundPlaying || !['cinematic', 'lonely', 'dreamy', 'peaceful', 'monochrome'].includes(mood)) {
            clearInterval(interval)
            return
          }
          g.gain.cancelScheduledValues(ctx.currentTime)
          g.gain.setValueAtTime(0.02, ctx.currentTime)
          g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 4)
          g.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 8 + idx)
        }, 15000)

        synthNodesRef.current.push(osc)
      })
    }
  }

  // Adjust volume
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime)
    }
  }, [volume])

  // Toggle playback
  useEffect(() => {
    if (soundPlaying) {
      initAudio()
      startSynthesis()
    } else {
      stopSynthesis()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundPlaying, mood])

  // Stop sound on unmount
  useEffect(() => {
    return () => {
      stopSynthesis()
    }
  }, [])

  return (
    <MoodContext.Provider value={{ mood, setMood, soundPlaying, setSoundPlaying, volume, setVolume }}>
      {children}
    </MoodContext.Provider>
  )
}

export function useMood() {
  const context = useContext(MoodContext)
  if (!context) {
    throw new Error('useMood must be used within a MoodProvider')
  }
  return context
}
