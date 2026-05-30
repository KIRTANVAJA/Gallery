import { FormEvent, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getLocalComments, addLocalComment, type LocalComment as Comment } from '../../utils/localDB'

interface PhotoCommentsProps {
  photoId: string
}

export function PhotoComments({ photoId }: PhotoCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const data = getLocalComments(photoId)
    setComments(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [photoId])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return
    addLocalComment(photoId, name, content)
    setContent('')
    load()
  }

  return (
    <div className="mt-8 border-t border-white/10 pt-8 max-h-64 overflow-y-auto">
      <p className="font-body text-[10px] tracking-[0.3em] text-gold uppercase mb-4">
        Reflections
      </p>

      {loading ? (
        <p className="text-cream-muted text-xs">Loading...</p>
      ) : comments.length === 0 ? (
        <p className="text-cream-muted text-xs italic">Be the first to leave a thought.</p>
      ) : (
        <ul className="space-y-4 mb-6">
          {comments.map((c) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-body text-sm"
            >
              <span className="text-gold/80">{c.authorName}</span>
              <p className="text-cream-muted mt-1">{c.content}</p>
              {c.replies?.map((r) => (
                <div key={r.id} className="ml-4 mt-2 border-l border-white/10 pl-4">
                  <span className="text-gold/60 text-xs">{r.authorName}</span>
                  <p className="text-cream-muted/80 text-xs mt-1">{r.content}</p>
                </div>
              ))}
            </motion.li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full bg-transparent border-b border-white/10 py-2 text-xs text-cream focus:outline-none focus:border-gold/40"
          required
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share a reflection..."
          rows={2}
          className="w-full bg-transparent border-b border-white/10 py-2 text-xs text-cream resize-none focus:outline-none focus:border-gold/40"
          required
        />
        <button
          type="submit"
          className="font-body text-[10px] tracking-widest uppercase text-gold hover:text-cream"
        >
          Post
        </button>
      </form>
    </div>
  )
}
