'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
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
      // 실패 시 조용히 무시 (네트워크 오류 등)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
        liked
          ? 'bg-rose-50 border-rose-300 text-rose-600'
          : 'bg-white border-[#012d1d]/20 text-[#012d1d]/60 hover:border-rose-300 hover:text-rose-500'
      } disabled:opacity-50`}
    >
      <Heart size={16} className={liked ? 'fill-rose-500 text-rose-500' : ''} />
      <span>{count.toLocaleString()}</span>
    </button>
  )
}
