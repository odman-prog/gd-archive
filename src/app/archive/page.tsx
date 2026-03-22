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
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('전체')
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState<SortKey>('created_at')
  const [page, setPage] = useState(1)

  const [contents, setContents] = useState<Content[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [allTags, setAllTags] = useState<string[]>([])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    supabase
      .from('contents')
      .select('tags')
      .eq('status', 'published')
      .not('tags', 'is', null)
      .then(({ data }) => {
        if (!data) return
        const tagSet = new Set<string>()
        data.forEach((row) => (row.tags as string[] | null)?.forEach((t) => tagSet.add(t)))
        setAllTags(Array.from(tagSet).sort())
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchContents = useCallback(async () => {
    setLoading(true)

    let q = supabase
      .from('contents')
      .select('id, title, excerpt, category, view_count, like_count, created_at, author_id, cover_image_url', { count: 'exact' })
      .eq('status', 'published')
      .order(sort, { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (category !== '전체') q = q.eq('category', category)
    if (tag) q = q.contains('tags', [tag])
    if (query.trim()) {
      q = q.or(`title.ilike.%${query.trim()}%,excerpt.ilike.%${query.trim()}%`)
    }

    const { data, count, error } = await q

    if (error && error.message?.includes('view_count')) {
      const { data: data2, count: count2 } = await supabase
        .from('contents')
        .select('id, title, excerpt, category, created_at, author_id', { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      if (data2 && data2.length > 0) {
        const ids2 = data2.map((c: {author_id: string}) => c.author_id).filter(Boolean) as string[]
        const uids2 = ids2.filter((id, i, arr) => arr.indexOf(id) === i)
        const pmap2: Record<string, { name: string; grade: number | null }> = {}
        if (uids2.length > 0) {
          const { data: pd2 } = await supabase.from('profiles').select('id, name, grade').in('id', uids2)
          ;(pd2 ?? []).forEach((p: {id: string; name: string; grade: number | null}) => { pmap2[p.id] = { name: p.name, grade: p.grade ?? null } })
        }
        const merged2 = data2.map((c: {id: string; title: string; excerpt: string | null; category: string | null; created_at: string; author_id: string}) => ({
          ...c, summary: c.excerpt, view_count: 0, like_count: 0, profiles: pmap2[c.author_id] ?? null,
        }))
        setContents(merged2 as unknown as Content[])
        setTotal(count2 ?? 0)
        setLoading(false)
        return
      }
      setContents([])
      setTotal(0)
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      const authorIds = data.map((c) => c.author_id).filter(Boolean) as string[]
      const uniqueIds = authorIds.filter((id, i, arr) => arr.indexOf(id) === i)
      const profileMap: Record<string, { name: string; grade: number | null }> = {}

      if (uniqueIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, grade')
          .in('id', uniqueIds)
        ;(profilesData ?? []).forEach((p) => {
          profileMap[p.id] = { name: p.name, grade: p.grade ?? null }
        })
      }

      const merged = data.map((c) => ({
        ...c,
        summary: c.excerpt,
        cover_image_url: c.cover_image_url ?? null,
        profiles: profileMap[c.author_id] ?? null,
      }))
      setContents(merged as unknown as Content[])
    } else {
      setContents([])
    }

    setTotal(count ?? 0)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, page, query, tag])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])

  function handleCategory(cat: string) { setCategory(cat); setPage(1) }
  function handleSort(s: SortKey) { setSort(s); setPage(1) }
  function handleSearch() { setQuery(search); setPage(1) }
  function handleTag(t: string) { setTag((prev) => prev === t ? '' : t); setPage(1) }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 border-b border-primary/10 pb-10">
        <div className="space-y-2">
          <p className="text-[10px] font-bold tracking-widest uppercase text-secondary">Archive</p>
          <h1 className="text-5xl font-serif italic font-bold text-primary leading-tight">아카이브</h1>
          <p className="text-primary/50 text-sm">지성의 발자취를 탐색해보세요.</p>
        </div>

        {/* 검색 */}
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30" />
            <input
              type="text"
              placeholder="제목 또는 내용 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-primary/15 bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 text-sm text-primary"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 rounded-full bg-primary text-cream text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            검색
          </button>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategory(cat)}
            className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-colors ${
              category === cat
                ? 'bg-primary text-cream'
                : 'bg-surface text-primary/50 hover:bg-primary/10 hover:text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 태그 필터 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => handleTag(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
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
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-primary/40">
          총 <span className="font-semibold text-primary">{total}</span>개
          {tag && <span className="ml-1 text-secondary font-medium">· #{tag}</span>}
        </p>
        <div className="flex gap-1 bg-surface rounded-full p-1">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleSort(s.value)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors ${
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
      {loading ? (
        <div className="flex justify-center items-center py-40">
          <Loader2 size={24} className="animate-spin text-primary/30" />
        </div>
      ) : contents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {contents.map((item) => (
            <ContentCard key={item.id} content={item} />
          ))}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center gap-3 text-primary/30">
          <Search size={32} strokeWidth={1.5} />
          <p className="text-sm">
            {query ? `"${query}"에 대한 검색 결과가 없습니다.` : '아직 등록된 글이 없습니다.'}
          </p>
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-14">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                <span key={`ellipsis-${i}`} className="px-2 text-primary/30 text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-full text-primary/40 hover:text-primary hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
