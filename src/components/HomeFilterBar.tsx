'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATS = ['전체', '기사', '에세이', '인터뷰', '시/수필', '독서감상문', '수행평가']

export default function HomeFilterBar() {
  const router = useRouter()
  const [input, setInput] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = input.trim()
    router.push(q ? `/archive?q=${encodeURIComponent(q)}` : '/archive')
  }

  return (
    <div className="sticky top-20 z-40 max-w-screen-2xl mx-auto px-6 md:px-12 mb-16">
      <div className="bg-white rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center border border-outline-variant/10" style={{ boxShadow: '0 12px 32px -4px rgba(28,21,21,0.06)' }}>
        <form onSubmit={handleSearch} className="relative w-full md:flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 text-[20px]">manage_search</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="아카이브에서 검색..."
            className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-secondary/30 transition-all font-sans text-sm"
          />
        </form>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {CATS.map((cat, i) => (
            <button
              key={cat}
              onClick={() => router.push(i === 0 ? '/archive' : `/archive`)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap font-sans flex items-center gap-1.5 transition-colors ${
                i === 0
                  ? 'bg-primary text-cream'
                  : 'bg-surface-container-high text-primary hover:bg-secondary-container'
              }`}
            >
              {i === 0 && <span className="material-symbols-outlined text-[15px]">filter_list</span>}
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
