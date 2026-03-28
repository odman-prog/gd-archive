'use client'

import { useState } from 'react'

type Props = {
  contentId: string
  initialCount: number
  initialLiked: boolean
  userId: string | null
}

export default function LikeButton({ contentId, initialCount, initialLiked, userId }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(false)

  async function toggle() {
    if (!userId) {
      setNotice(true)
      setTimeout(() => setNotice(false), 2500)
      return
    }
    if (loading) return
    setLoading(true)

    const prevLiked = liked
    const prevCount = count
    setLiked(!liked)
    setCount((c) => liked ? c - 1 : c + 1)

    try {
      const res = await fetch('/api/content/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.liked !== undefined) {
        setLiked(data.liked)
        setCount(data.count)
      }
    } catch {
      setLiked(prevLiked)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      {notice && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 bg-primary text-cream text-xs rounded-lg shadow-lg font-sans">
          로그인 후 좋아요를 누를 수 있습니다
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-primary" />
        </div>
      )}
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium font-sans disabled:opacity-50 ${
          liked
            ? 'bg-secondary-container text-on-secondary-container'
            : 'hover:bg-surface text-primary/70'
        }`}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0", color: liked ? '#775a19' : undefined }}
        >
          favorite
        </span>
        <span className="font-bold">{count.toLocaleString()}</span>
      </button>
    </div>
  )
}
