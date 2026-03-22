'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  contentId: string
  initialCount: number
  initialLiked: boolean
  userId: string | null
}

export default function LikeButton({ contentId, initialCount, initialLiked, userId }: Props) {
  const supabase = createClient()
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

    try {
      if (liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('content_id', contentId)
          .eq('user_id', userId)
        if (error) throw error
        await supabase.from('contents').update({ like_count: count - 1 }).eq('id', contentId)
        setLiked(false)
        setCount((c) => c - 1)
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ content_id: contentId, user_id: userId })
        if (error) throw error
        await supabase.from('contents').update({ like_count: count + 1 }).eq('id', contentId)
        setLiked(true)
        setCount((c) => c + 1)
      }
    } catch {
      // 실패 시 조용히 무시
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
