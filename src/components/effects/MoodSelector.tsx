import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMood, type MoodType } from '../../context/MoodContext'

const moodOptions: { id: MoodType; label: string; icon: string; desc: string }[] = [
  { id: 'cinematic', label: 'Cinematic', icon: '🎬', desc: 'Poetic wide format, low-contrast shadows' },
  { id: 'rainy-nights', label: 'Rainy Nights', icon: '🌧️', desc: 'Matte cool overlay, synthesizer rain soundscape' },
  { id: 'golden-hour', label: 'Golden Hour', icon: '🌇', desc: 'Warm amber glow, slow piano chords' },
  { id: 'nostalgic', label: 'Nostalgic', icon: '🎞️', desc: 'Sepia grade, crackling vinyl record' },
  { id: 'lonely', label: 'Lonely', icon: '👤', desc: 'Cool vignette borders, deep soundscape drone' },
  { id: 'dreamy', label: 'Dreamy', icon: '☁️', desc: 'Soft-focus glow filter, warm ambient swell' },
  { id: 'peaceful', label: 'Peaceful', icon: '🕊️', desc: 'Muted natural tones, acoustic synth notes' },
  { id: 'monochrome', label: 'Monochrome', icon: '🏁', desc: 'High-contrast black & white, film hum' },
]

export function MoodSelector() {
  const { mood, setMood, soundPlaying, setSoundPlaying, volume, setVolume } = useMood()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-[99] flex flex-col items-end gap-3 select-none">
      
      {/* Expanded Mood Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-72 border border-white/10 bg-charcoal-light/60 backdrop-blur-2xl p-4 rounded-lg shadow-2xl text-cream font-body relative overflow-hidden"
          >
            {/* Ambient Audio Controls */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
              <span className="text-[10px] tracking-widest text-gold uppercase font-bold">Atmospheric Sound</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSoundPlaying(!soundPlaying)}
                  className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border transition-all font-semibold ${
                    soundPlaying
                      ? 'bg-gold/15 text-gold border-gold/30 shadow-[0_0_10px_rgba(201,169,98,0.1)]'
                      : 'border-white/15 text-cream-muted'
                  }`}
                >
                  {soundPlaying ? 'Active' : 'Mute'}
                </button>
                {soundPlaying && (
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
                )}
              </div>
            </div>

            {/* List of Moods */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {moodOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setMood(opt.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded text-left transition-all ${
                    mood === opt.id
                      ? 'bg-gold/10 border border-gold/30 text-gold shadow-md'
                      : 'border border-transparent text-cream-muted hover:bg-white/5 hover:text-cream'
                  }`}
                >
                  <span className="text-sm">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold tracking-wide uppercase">{opt.label}</span>
                    <span className="block text-[9px] text-cream-muted/60 truncate mt-0.5">{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={`h-11 px-4 flex items-center gap-2 border bg-charcoal/80 backdrop-blur-md rounded-full shadow-lg transition-all duration-300 cursor-hover select-none ${
          isOpen
            ? 'border-gold text-gold shadow-[0_0_15px_rgba(201,169,98,0.2)]'
            : 'border-white/10 text-cream-muted hover:border-gold/40 hover:text-cream hover:shadow-[0_0_12px_rgba(201,169,98,0.15)]'
        }`}
      >
        <span className="text-xs uppercase tracking-[0.25em] font-semibold">
          Mood: {moodOptions.find((o) => o.id === mood)?.label}
        </span>
        <span className="text-xs">
          {moodOptions.find((o) => o.id === mood)?.icon}
        </span>
      </button>

    </div>
  )
}
