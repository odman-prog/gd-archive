import Link from 'next/link'
import { BookOpen, Users, Eye, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ContentCard from '@/components/ContentCard'

async function getStats(supabase: ReturnType<typeof createClient>) {
  const [contents, profiles, views, newMonth] = await Promise.all([
    supabase.from('contents').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('contents').select('view_count').eq('status', 'published'),
    supabase.from('contents').select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

  const totalViews = (views.data ?? []).reduce((sum, r) => sum + (r.view_count ?? 0), 0)
  return {
    contentCount: contents.count ?? 0,
    studentCount: profiles.count ?? 0,
    totalViews,
    newThisMonth: newMonth.count ?? 0,
  }
}

async function getContentList(supabase: ReturnType<typeof createClient>, featured: boolean, limit: number) {
  let q = supabase
    .from('contents')
    .select('id, title, excerpt, category, view_count, like_count, created_at, author_id, cover_image_url')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (featured) q = q.eq('featured', true)

  const { data } = await q
  if (!data || data.length === 0) return []

  const ids = data.map((c) => c.author_id).filter(Boolean) as string[]
  const uniqueIds = ids.filter((id, i, arr) => arr.indexOf(id) === i)
  const profileMap: Record<string, { name: string }> = {}

  if (uniqueIds.length > 0) {
    const { data: pd } = await supabase.from('profiles').select('id, name').in('id', uniqueIds)
    ;(pd ?? []).forEach((p) => { profileMap[p.id] = { name: p.name } })
  }

  return data.map((c) => ({
    ...c,
    summary: c.excerpt,
    cover_image_url: c.cover_image_url ?? null,
    profiles: profileMap[c.author_id] ?? null,
  }))
}

export default async function Home() {
  const supabase = createClient()
  const [stats, featured, latest] = await Promise.all([
    getStats(supabase),
    getContentList(supabase, true, 3),
    getContentList(supabase, false, 6),
  ])

  const statCards = [
    { icon: <BookOpen size={18} />, label: '발행된 글', value: stats.contentCount.toLocaleString() },
    { icon: <Users size={18} />, label: '참여 학생', value: stats.studentCount.toLocaleString() },
    { icon: <Eye size={18} />, label: '총 조회수', value: stats.totalViews.toLocaleString() },
    { icon: <Sparkles size={18} />, label: '이번 달 신규', value: stats.newThisMonth.toLocaleString() },
  ]

  return (
    <div>
      {/* 히어로 */}
      <section className="bg-primary text-cream py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 border border-secondary/40 rounded-full text-[10px] font-bold tracking-widest uppercase text-secondary mb-8">
              Gwangdeok Archive
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight tracking-tighter mb-6">
              기록으로<br />피어나는 지성
            </h1>
            <p className="text-lg text-cream/60 leading-relaxed max-w-xl mb-10">
              광덕고등학교 학생들의 생각이 모이고, 빛나는 곳
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/archive"
                className="px-8 py-3.5 rounded-full bg-secondary text-white font-semibold text-sm hover:bg-secondary/90 transition-colors"
              >
                아카이브 둘러보기
              </Link>
              <Link
                href="/write"
                className="px-8 py-3.5 rounded-full border border-cream/25 text-cream/80 font-semibold text-sm hover:bg-cream/10 transition-colors"
              >
                글 올리기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 통계 카드 */}
      <section className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-primary/8 shadow-sm p-5 flex flex-col gap-2">
              <div className="text-secondary">{card.icon}</div>
              <p className="text-2xl font-serif font-bold text-primary">{card.value}</p>
              <p className="text-xs text-primary/45 font-sans">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 편집부 PICK */}
      <section className="max-w-6xl mx-auto px-6 mt-20">
        <div className="flex items-end justify-between mb-8 border-b border-primary/10 pb-5">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-1">Curated</p>
            <h2 className="text-2xl font-serif font-bold text-primary">편집부 PICK</h2>
          </div>
          <Link href="/archive" className="text-xs font-semibold text-secondary hover:underline tracking-wide">
            전체 보기 →
          </Link>
        </div>
        {featured.length > 0 ? (
          featured.length === 1 ? (
            /* 1개일 때: 풀 히어로 카드 */
            <FeaturedHero item={featured[0] as Parameters<typeof FeaturedHero>[0]['item']} />
          ) : (
            /* 2개 이상: 첫 번째는 히어로, 나머지는 그리드 */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7">
                <FeaturedHero item={featured[0] as Parameters<typeof FeaturedHero>[0]['item']} />
              </div>
              <div className="lg:col-span-5 grid grid-cols-1 gap-5">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {featured.slice(1).map((item) => <ContentCard key={item.id} content={item as any} />)}
              </div>
            </div>
          )
        ) : (
          <EmptyState message="아직 편집부가 선정한 글이 없습니다." />
        )}
      </section>

      {/* 최신 글 */}
      <section className="max-w-6xl mx-auto px-6 mt-16 mb-24">
        <div className="flex items-end justify-between mb-8 border-b border-primary/10 pb-5">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-1">Latest</p>
            <h2 className="text-2xl font-serif font-bold text-primary">최신 글</h2>
          </div>
          <Link href="/archive" className="text-xs font-semibold text-secondary hover:underline tracking-wide">
            전체 보기 →
          </Link>
        </div>
        {latest.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {latest.map((item) => <ContentCard key={item.id} content={item as any} />)}
          </div>
        ) : (
          <EmptyState message="아직 등록된 글이 없습니다. 첫 번째 글을 올려보세요!" />
        )}
      </section>
    </div>
  )
}

type FeaturedItem = {
  id: string
  title: string
  excerpt: string | null
  category: string | null
  cover_image_url?: string | null
  profiles: { name: string } | null
}

function FeaturedHero({ item }: { item: FeaturedItem }) {
  const gradient = {
    '기사': 'from-blue-950 to-blue-800',
    '에세이': 'from-emerald-950 to-emerald-800',
    '인터뷰': 'from-violet-950 to-violet-800',
    '시/수필': 'from-pink-950 to-pink-800',
    '독서감상문': 'from-amber-950 to-amber-800',
    '수행평가': 'from-orange-950 to-orange-800',
  }[item.category ?? ''] ?? 'from-primary to-[#1a4432]'

  return (
    <Link href={`/archive/${item.id}`}>
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl group cursor-pointer">
        {item.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.cover_image_url}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          {item.category && (
            <span className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-3 block">
              {item.category}
            </span>
          )}
          <h3 className="text-2xl md:text-3xl font-serif font-bold mb-2 leading-tight line-clamp-2">
            {item.title}
          </h3>
          {item.excerpt && (
            <p className="text-sm text-white/70 line-clamp-2 font-sans">{item.excerpt}</p>
          )}
          {item.profiles && (
            <p className="text-xs text-white/50 mt-3 font-sans">{item.profiles.name}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-20 flex flex-col items-center gap-3 text-primary/30">
      <BookOpen size={32} strokeWidth={1.5} />
      <p className="text-sm font-sans">{message}</p>
    </div>
  )
}
