'use client'

import { useEffect } from 'react'

export default function ViewTracker({ contentId }: { contentId: string }) {
  useEffect(() => {
    const key = `viewed_${contentId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch('/api/content/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: contentId }),
      keepalive: true,
    })
  }, [contentId])

  return null
}
