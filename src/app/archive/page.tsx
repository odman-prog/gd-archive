'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ContentCard, { type Content } from '@/components/ContentCard'

const CATEGORIES = ['전체', '기사', '에세이', '인터뷰', '시/수필', '독서감상문', '수행평가']
const SORTS = [
  { label: '최신순', value: 'created_at' },
  { label: '인기순', value: 'like_count' },
  { label: '조회순', value: 'view_count' },
] as const

const PAGE_SIZE = 12

type SortKey = typeof SORTS[number]['value']

export default function ArchivePage() {
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')       // 실제 검색에 사용 (Enter/버튼)
  const [category, setCategory] = useState('전체')
  const [sort, setSort] = useState<SortKey>('created_at')
  const [page, setPage] = useState(1)

  const [contents, setContents] = useState<Content[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchContents = useCallback(async () => {
    setLoading(true)

    let q = supabase
      .from('contents')
      .select('id, title, summary, category, view_count, like_count, created_at, profiles(name, grade, class_num)', { count: 'exact' })
      .eq('status', 'published')
      .order(sort, { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (category !== '전체') q = q.eq('category', category)
    if (query.trim()) {
      q = q.or(`title.ilike.%${query.trim()}%,summary.ilike.%${query.trim()}%`)
    }

    const { data, count, error } = await q

    if (!error) {
      setContents((data as unknown as Content[]) ?? [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [supabase, category, sort, page, query])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  // 필터/정렬 변경 시 1페이지로 리셋
  function handleCategory(cat: string) {
    setCategory(cat)
    setPage(1)
  }
  function handleSort(s: SortKey) {
    setSort(s)
    setPage(1)
  }
  function handleSearch() {
    setQuery(search)
    setPage(1)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B4332]">아카이브</h1>
        <p className="text-sm text-[#1B4332]/50 mt-1">광덕고등학교 학생들의 모든 글</p>
      </div>

      {/* 검색바 */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B4332]/30" />
          <input
            type="text"
            placeholder="제목 또는 내용으로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#1B4332]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-5 py-2.5 rounded-lg bg-[#1B4332] text-[#FEFAE0] text-sm font-medium hover:bg-[#163728] transition-colors"
        >
          검색
        </button>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((cat) => {
          const isActive = category === cat
          return (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                isActive
                  ? 'bg-[#1B4332] text-[#FEFAE0] border-[#1B4332]'
                  : `bg-white border-[#1B4332]/15 text-[#1B4332]/60 hover:border-[#1B4332]/40 hover:text-[#1B4332]`
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* 정렬 + 결과 수 */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#1B4332]/50">
          총 <span className="font-semibold text-[#1B4332]">{total}</span>개
        </p>
        <div className="flex gap-1">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleSort(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sort === s.value
                  ? 'bg-[#D4A373] text-[#1B4332]'
                  : 'text-[#1B4332]/50 hover:text-[#1B4332]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 그리드 */}
      {loading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 size={28} className="animate-spin text-[#1B4332]/30" />
        </div>
      ) : contents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {contents.map((item) => (
            <ContentCard key={item.id} content={item} />
          ))}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center gap-3 text-[#1B4332]/40">
          <span className="text-4xl">📭</span>
          <p className="text-sm">
            {query ? `"${query}"에 대한 검색 결과가 없습니다.` : '아직 등록된 글이 없습니다.'}
          </p>
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-12">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg text-[#1B4332]/40 hover:text-[#1B4332] hover:bg-[#1B4332]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                <span key={`ellipsis-${i}`} className="px-2 text-[#1B4332]/30 text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === p
                      ? 'bg-[#1B4332] text-[#FEFAE0]'
                      : 'text-[#1B4332]/60 hover:bg-[#1B4332]/5'
                  }`}
                >
                  {p}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg text-[#1B4332]/40 hover:text-[#1B4332] hover:bg-[#1B4332]/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
