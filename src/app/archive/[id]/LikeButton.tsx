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

  async function toggle() {
    if (!userId) {
      alert('로그인 후 좋아요를 누를 수 있습니다.')
      return
    }
    if (loading) return
    setLoading(true)

    // Optimistic update
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
      // 실패 시 원래 상태로 복구
      setLiked(prevLiked)
      setCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}
