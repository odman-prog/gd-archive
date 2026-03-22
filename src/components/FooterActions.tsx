'use client'

import { useState } from 'react'

export default function FooterActions() {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.origin
    if (navigator.share) {
      await navigator.share({
        title: '광덕아카이브',
        text: '광덕고등학교 국어과 교지편집부 아카이브',
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.origin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-6 items-center">
      {copied && (
        <span className="text-secondary text-xs font-sans animate-pulse">링크 복사됨!</span>
      )}
      <button
        onClick={handleShare}
        aria-label="공유"
        className="text-cream/40 hover:text-secondary cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined">share</span>
      </button>
      <button
        onClick={handleCopy}
        aria-label="링크 복사"
        className="text-cream/40 hover:text-secondary cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined">content_copy</span>
      </button>
    </div>
  )
}
