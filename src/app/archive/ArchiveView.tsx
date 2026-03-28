'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import ContentCard, { type Content } from '@/components/ContentCard'

const CATEGORIES = ['전체', '기사', '에세이', '인터뷰', '시/수필', '독서감상문', '수행평가', '교사의 서재']
const SORTS = [
  { label: '최신순', value: 'created_at' },
  { label: '인기순', value: 'like_count' },
  { label: '조회순', value: 'view_count' },
] as const

const PAGE_SIZE = 12

type Props = {
  contents: Content[]
  total: number
  allTags: string[]
  category: string
  tag: string
  sort: string
  page: number
  query: string
}

export default function ArchiveView({ contents, total, allTags, category, tag, sort, page, query }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(query)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function navigate(params: {
    category?: string
    tag?: string
    sort?: string
    page?: number
    q?: string
  }) {
    const p = new URLSearchParams()
    const c = params.category ?? category
    const t = params.tag ?? tag
    const s = params.sort ?? sort
    const pg = params.page ?? 1
    const q = params.q ?? query

    if (c && c !== '전체') p.set('category', c)
    if (t) p.set('tag', t)
    if (s && s !== 'created_at') p.set('sort', s)
    if (pg > 1) p.set('page', String(pg))
    if (q) p.set('q', q)

    startTransition(() => {
      router.push('/archive' + (p.toString() ? '?' + p.toString() : ''))
    })
  }

  return (
    <div className="bg-surface">

      {/* ── 히어로 ───────────────────────────────────── */}
      <div className="relative h-[420px] md:h-[540px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/i.png" alt="" fetchPriority="high" decoding="async" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-primary/30 to-surface" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end max-w-screen-2xl mx-auto px-8 md:px-12 pb-14">
          <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream/50 mb-4 block">Gwangdeok Archive</span>
          <h1 className="font-serif text-6xl md:text-8xl text-cream italic leading-[0.88] tracking-tighter mb-5">
            아카이브
          </h1>
          <div className="h-px w-16 bg-secondary mb-5" />
          <p className="font-sans text-base text-cream/60 max-w-sm leading-relaxed">
            지성의 발자취를 탐색해보세요.
          </p>
        </div>

        {/* 검색창 — 히어로 하단 우측 */}
        <div className="absolute bottom-10 right-8 md:right-12 hidden md:flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" />
            <input
              type="text"
              placeholder="제목 또는 내용 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate({ q: search.trim(), page: 1 })}
              className="pl-10 pr-4 py-2.5 w-64 rounded-full border border-white/20 bg-white/90 backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-primary"
            />
          </div>
          <button
            onClick={() => navigate({ q: search.trim(), page: 1 })}
            className="px-5 py-2.5 rounded-full bg-primary text-cream text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            검색
          </button>
        </div>
      </div>

      {/* ── 필터 + 콘텐츠 영역 ───────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-8 md:px-12 py-12">

        {/* 모바일 검색 */}
        <div className="flex gap-2 mb-8 md:hidden">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" />
            <input
              type="text"
              placeholder="제목 또는 내용 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate({ q: search.trim(), page: 1 })}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-primary/15 bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm text-primary"
            />
          </div>
          <button
            onClick={() => navigate({ q: search.trim(), page: 1 })}
            className="px-5 py-2.5 rounded-full bg-primary text-cream text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            검색
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => navigate({ category: cat, page: 1 })}
              className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-colors font-sans ${
                category === cat
                  ? 'bg-primary text-cream'
                  : 'bg-white border border-primary/10 text-primary/50 hover:bg-primary/8 hover:text-primary hover:border-primary/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 태그 필터 */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => navigate({ tag: tag === t ? '' : t, page: 1 })}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border font-sans ${
                  tag === t
                    ? 'bg-secondary text-white border-secondary'
                    : 'bg-white border-primary/10 text-primary/45 hover:border-secondary/50 hover:text-secondary'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {/* 정렬 + 총 개수 */}
        <div className="flex items-center justify-between mb-10 border-b border-primary/8 pb-6">
          <p className="font-sans text-sm text-primary/40">
            총 <span className="font-semibold text-primary">{total}</span>개
            {tag && <span className="ml-1 text-secondary font-medium">· #{tag}</span>}
            {query && <span className="ml-1 text-primary/40 font-medium">· &ldquo;{query}&rdquo;</span>}
          </p>
          <div className="flex gap-1 bg-surface-container-low rounded-full p-1">
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => navigate({ sort: s.value, page: 1 })}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold font-sans transition-colors ${
                  sort === s.value
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-primary/40 hover:text-primary'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 컨텐츠 그리드 */}
        {isPending ? (
          <div className="flex justify-center items-center py-40">
            <Loader2 size={24} className="animate-spin text-primary/30" />
          </div>
        ) : contents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {contents.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center gap-4 text-primary/30">
            <span className="material-symbols-outlined text-[48px]">search_off</span>
            <p className="font-sans text-sm">
              {query ? `"${query}"에 대한 검색 결과가 없습니다.` : '아직 등록된 글이 없습니다.'}
            </p>
          </div>
        )}

        {/* 페이지네이션 */}
        {!isPending && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-16">
            <button
              onClick={() => navigate({ page: Math.max(1, page - 1) })}
              disabled={page === 1}
              className="p-2 rounded-full text-primary/40 hover:text-primary hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-primary/30 text-sm font-sans">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => navigate({ page: p as number })}
                    className={`w-9 h-9 rounded-full text-sm font-semibold font-sans transition-colors ${
                      page === p
                        ? 'bg-primary text-cream'
                        : 'text-primary/50 hover:bg-surface'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => navigate({ page: Math.min(totalPages, page + 1) })}
              disabled={page === totalPages}
              className="p-2 rounded-full text-primary/40 hover:text-primary hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
