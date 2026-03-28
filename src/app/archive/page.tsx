import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import ArchiveView from './ArchiveView'
import type { Content } from '@/components/ContentCard'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12
const VALID_SORTS = ['created_at', 'like_count', 'view_count'] as const
type SortKey = typeof VALID_SORTS[number]

function getPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const fetchArchiveData = unstable_cache(
  async (category: string, tag: string, sort: SortKey, page: number, query: string) => {
    const supabase = getPublicClient()

    const [tagResult, contentsResult] = await Promise.all([
      supabase.from('contents').select('tags').eq('status', 'published').not('tags', 'is', null),
      (() => {
        let q = supabase
          .from('contents')
          .select(
            'id, title, excerpt, category, view_count, like_count, created_at, author_id, cover_image_url, profiles!author_id(name, grade)',
            { count: 'exact' }
          )
          .eq('status', 'published')
          .order(sort, { ascending: false })
          .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

        if (category !== '전체') q = q.eq('category', category)
        if (tag) q = q.contains('tags', [tag])
        if (query.trim()) q = q.or(`title.ilike.%${query.trim()}%,excerpt.ilike.%${query.trim()}%`)

        return q
      })(),
    ])

    const tagSet = new Set<string>()
    tagResult.data?.forEach((row) =>
      (row.tags as string[] | null)?.forEach((t) => tagSet.add(t))
    )
    const allTags = Array.from(tagSet).sort()

    const contents: Content[] = (contentsResult.data ?? []).map((c) => {
      const p = c.profiles
      const profile = Array.isArray(p)
        ? (p[0] ?? null)
        : (p as { name: string; grade: number | null } | null)
      return {
        id: c.id,
        title: c.title,
        summary: c.excerpt,
        category: c.category,
        view_count: c.view_count,
        like_count: c.like_count,
        created_at: c.created_at,
        cover_image_url: c.cover_image_url ?? null,
        profiles: profile,
      }
    })

    return { contents, total: contentsResult.count ?? 0, allTags }
  },
  ['archive-data'],
  { revalidate: 30, tags: ['archive'] }
)

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: { category?: string; tag?: string; sort?: string; page?: string; q?: string }
}) {
  const category = searchParams.category ?? '전체'
  const tag = searchParams.tag ?? ''
  const sort: SortKey = VALID_SORTS.includes(searchParams.sort as SortKey)
    ? (searchParams.sort as SortKey)
    : 'created_at'
  const page = Math.max(1, parseInt(searchParams.page ?? '1') || 1)
  const query = searchParams.q ?? ''

  const { contents, total, allTags } = await fetchArchiveData(category, tag, sort, page, query)

  return (
    <ArchiveView
      contents={contents}
      total={total}
      allTags={allTags}
      category={category}
      tag={tag}
      sort={sort}
      page={page}
      query={query}
    />
  )
}
