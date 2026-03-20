import Link from 'next/link'
import { BookOpen, Users, Eye, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ContentCard from '@/components/ContentCard'

async function getStats(supabase: ReturnType<typeof createClient>) {
  const [contents, profiles, views] = await Promise.all([
    supabase.from('contents').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('contents').select('view_count'),
  ])

  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const { count: newThisMonth } = await supabase
    .from('contents')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', thisMonth.toISOString())

  const totalViews = (views.data ?? []).reduce((sum, r) => sum + (r.view_count ?? 0), 0)

  return {
    contentCount: contents.count ?? 0,
    studentCount: profiles.count ?? 0,
    totalViews,
    newThisMonth: newThisMonth ?? 0,
  }
}

async function getFeatured(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from('contents')
    .select('id, title, summary, category, view_count, like_count, created_at, profiles(name)')
    .eq('featured', true)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

async function getLatest(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from('contents')
    .select('id, title, summary, category, view_count, like_count, created_at, profiles(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6)
  return data ?? []
}

export default async function Home() {
  const supabase = createClient()
  const [stats, featured, latest] = await Promise.all([
    getStats(supabase),
    getFeatured(supabase),
    getLatest(supabase),
  ])

  const statCards = [
    { icon: <BookOpen size={20} />, label: '전체 콘텐츠', value: stats.contentCount.toLocaleString() },
    { icon: <Users size={20} />, label: '참여 학생', value: stats.studentCount.toLocaleString() },
    { icon: <Eye size={20} />, label: '총 조회수', value: stats.totalViews.toLocaleString() },
    { icon: <Sparkles size={20} />, label: '이번 달 신규', value: stats.newThisMonth.toLocaleString() },
  ]

  return (
    <div>
      {/* ── 히어로 ──────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1B4332] text-[#FEFAE0] py-24 px-4">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <span className="text-5xl">📚</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            광덕아카이브
          </h1>
          <p className="text-lg md:text-xl text-[#FEFAE0]/70 max-w-xl leading-relaxed">
            광덕고등학교 학생들의 생각이 모이고, 빛나는 곳
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <Link
              href="/archive"
              className="px-6 py-3 rounded-full bg-[#D4A373] text-[#1B4332] font-semibold text-sm hover:bg-[#c49060] transition-colors"
            >
              아카이브 둘러보기
            </Link>
            <Link
              href="/write"
              className="px-6 py-3 rounded-full border border-[#FEFAE0]/40 text-[#FEFAE0] font-semibold text-sm hover:bg-[#FEFAE0]/10 transition-colors"
            >
              글 올리기
            </Link>
          </div>
        </div>
      </section>

      {/* ── 통계 카드 ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-[#1B4332]/10 shadow-sm p-5 flex flex-col gap-2"
            >
              <div className="text-[#D4A373]">{card.icon}</div>
              <p className="text-2xl font-bold text-[#1B4332]">{card.value}</p>
              <p className="text-xs text-[#1B4332]/50">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 편집부 PICK ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 mt-16">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[#D4A373] text-xl">✦</span>
          <h2 className="text-xl font-bold text-[#1B4332]">편집부 PICK</h2>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featured.map((item) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <ContentCard key={item.id} content={item as any} />
            ))}
          </div>
        ) : (
          <EmptyState message="아직 편집부가 선정한 글이 없습니다." />
        )}
      </section>

      {/* ── 최신 글 ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 mt-16 mb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1B4332]">최신 글</h2>
          <Link href="/archive" className="text-sm text-[#D4A373] hover:underline font-medium">
            전체 보기 →
          </Link>
        </div>
        {latest.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {latest.map((item) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <ContentCard key={item.id} content={item as any} />
            ))}
          </div>
        ) : (
          <EmptyState message="아직 등록된 글이 없습니다. 첫 번째 글을 올려보세요!" />
        )}
      </section>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-[#1B4332]/40">
      <span className="text-4xl">📭</span>
      <p className="text-sm">{message}</p>
    </div>
  )
}
