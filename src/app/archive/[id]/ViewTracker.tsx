'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ViewTracker({ contentId, currentViews }: { contentId: string; currentViews: number }) {
  useEffect(() => {
    const key = `viewed_${contentId}`
    if (sessionStorage.getItem(key)) return // 이미 이 세션에서 조회함

    sessionStorage.setItem(key, '1')
    const supabase = createClient()
    supabase
      .from('contents')
      .update({ view_count: currentViews + 1 })
      .eq('id', contentId)
      .then(() => {})
  }, [contentId, currentViews])

  return null
}
