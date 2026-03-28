'use client'

import { useState } from 'react'

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

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
        <ShareIcon />
      </button>
      <button
        onClick={handleCopy}
        aria-label="링크 복사"
        className="text-cream/40 hover:text-secondary cursor-pointer transition-colors"
      >
        <CopyIcon />
      </button>
    </div>
  )
}
