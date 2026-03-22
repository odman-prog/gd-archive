import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import ContentCard from '@/components/ContentCard'
import HomeFilterBar from '@/components/HomeFilterBar'
import { CATEGORY_GRADIENTS } from '@/components/ContentCard'

async function getStats(supabase: ReturnType<typeof createClient>) {
  const [contents, profiles] = await Promise.all([
    supabase.from('contents').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ])
  return {
    contentCount: contents.count ?? 0,
    studentCount: profiles.count ?? 0,
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

  const mainFeatured = featured[0] ?? latest[0] ?? null
  const sidebarItems = featured.length >= 2 ? featured.slice(1, 3) : latest.slice(0, 2)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latestForGrid = latest.filter((item) => item.id !== mainFeatured?.id) as any[]

  return (
    <div className="pb-24 md:pb-0">

      {/* ── 히어로 섹션 ────────────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          {/* 왼쪽: 에디토리얼 헤드라인 */}
          <div className="lg:col-span-7">
            <span className="text-xs font-bold tracking-widest uppercase text-secondary mb-4 block font-sans">
              Featured Collection
            </span>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-primary leading-[1.1] mb-6 tracking-tight">
              기록으로<br />피어나는<br />지성
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed font-sans mb-8">
              광덕고등학교 학생들의 생각이 모이고 빛나는 곳.<br />
              지성의 발자취를 탐색해보세요.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/archive"
                className="px-8 py-3.5 rounded-full bg-secondary text-cream font-bold text-sm hover:bg-secondary/90 transition-colors font-sans"
              >
                아카이브 탐색
              </Link>
              <Link
                href="/write"
                className="px-8 py-3.5 rounded-full border border-primary/20 text-primary font-bold text-sm hover:bg-surface transition-colors font-sans"
              >
                글 올리기
              </Link>
            </div>
          </div>

          {/* 오른쪽: 편집부 노트 */}
          <div className="lg:col-span-5">
            <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-secondary">
              <h3 className="font-serif text-xl font-bold text-primary mb-3">편집부 노트</h3>
              {mainFeatured ? (
                <>
                  <p className="text-sm text-on-surface-variant italic leading-relaxed line-clamp-4 font-sans">
                    &ldquo;{mainFeatured.summary ?? mainFeatured.title}&rdquo;
                  </p>
                  {mainFeatured.profiles && (
                    <p className="mt-4 text-xs font-bold uppercase tracking-widest text-secondary font-sans">
                      — {mainFeatured.profiles.name}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-on-surface-variant italic leading-relaxed font-sans">
                  &ldquo;이 아카이브는 우리 학교의 지적 유산과 무한한 가능성의 다리를 잇는 공간입니다.&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 스티키 필터 바 ─────────────────────────── */}
      <HomeFilterBar />

      {/* ── 메인 콘텐츠 그리드 ──────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* ── 메인 (8/12) ─────────────────────────── */}
          <article className="lg:col-span-8 space-y-16">

            {/* 피처드 아티클 읽기 모드 */}
            {mainFeatured ? (
              <div>
                {/* 커버 이미지 */}
                <div className="relative rounded-2xl overflow-hidden aspect-[16/9] mb-8 shadow-sm">
                  {mainFeatured.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mainFeatured.cover_image_url}
                      alt={mainFeatured.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[mainFeatured.category ?? ''] ?? 'from-primary to-[#1a4432]'}`} />
                  )}
                </div>

                {/* 메타 */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  {mainFeatured.category && (
                    <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest font-sans">
                      {mainFeatured.category}
                    </span>
                  )}
                  <span className="text-on-surface-variant text-xs font-sans">
                    {mainFeatured.profiles?.name} · {format(new Date(mainFeatured.created_at), 'yyyy년 M월 d일', { locale: ko })}
                  </span>
                </div>

                {/* 제목 */}
                <h2 className="font-serif text-4xl font-bold text-primary mb-8 leading-snug">
                  {mainFeatured.title}
                </h2>

                {/* 본문 preview (drop cap) */}
                {mainFeatured.summary && (
                  <p
                    className="text-xl leading-relaxed text-on-surface font-sans mb-10"
                    style={{
                      display: 'flow-root',
                    }}
                  >
                    <span className="float-left font-serif font-bold text-primary mr-2 leading-none" style={{ fontSize: '4.5rem', lineHeight: 0.85 }}>
                      {mainFeatured.summary[0]}
                    </span>
                    {mainFeatured.summary.slice(1)}
                  </p>
                )}

                {/* 인용구 */}
                {mainFeatured.summary && mainFeatured.summary.length > 80 && (
                  <blockquote className="border-l-4 border-secondary pl-8 py-4 my-10 bg-surface-container-low rounded-r-xl">
                    <p className="font-serif text-2xl italic text-primary font-medium leading-relaxed line-clamp-2">
                      &ldquo;{mainFeatured.summary.substring(0, 120)}&hellip;&rdquo;
                    </p>
                    {mainFeatured.profiles && (
                      <cite className="block mt-4 text-sm font-bold uppercase tracking-widest text-secondary font-sans not-italic">
                        — {mainFeatured.profiles.name}
                      </cite>
                    )}
                  </blockquote>
                )}

                <Link
                  href={`/archive/${mainFeatured.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-cream text-sm font-bold hover:bg-primary/90 transition-colors font-sans"
                >
                  전문 읽기
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center gap-3 text-primary/30">
                <span className="material-symbols-outlined text-[40px]">menu_book</span>
                <p className="text-sm font-sans">아직 등록된 글이 없습니다. 첫 번째 글을 올려보세요!</p>
              </div>
            )}

            {/* 최신 글 그리드 */}
            {latestForGrid.length > 0 && (
              <section className="pt-16 border-t border-outline-variant/15">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-1 font-sans">Latest</p>
                    <h2 className="font-serif text-2xl font-bold text-primary">최신 글</h2>
                  </div>
                  <Link href="/archive" className="text-xs font-bold text-secondary hover:underline tracking-wide font-sans flex items-center gap-1">
                    전체 보기
                    <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {latestForGrid.slice(0, 4).map((item) => (
                    <ContentCard key={item.id} content={item} />
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* ── 사이드바 (4/12) ──────────────────────── */}
          <aside className="lg:col-span-4 space-y-8">

            {/* 통계 벤토 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary text-cream p-6 rounded-2xl flex flex-col justify-between aspect-square">
                <span className="material-symbols-outlined text-secondary-container text-[24px]">menu_book</span>
                <div>
                  <div className="font-serif text-3xl font-bold">{stats.contentCount.toLocaleString()}</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase opacity-60 font-sans mt-1">발행된 글</div>
                </div>
              </div>
              <div className="bg-surface-container-high p-6 rounded-2xl flex flex-col justify-between aspect-square">
                <span className="material-symbols-outlined text-primary text-[24px]">group</span>
                <div>
                  <div className="font-serif text-3xl font-bold text-primary">{stats.studentCount.toLocaleString()}</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-primary/50 font-sans mt-1">참여 학생</div>
                </div>
              </div>
            </div>

            {/* 더 읽어보기 */}
            {sidebarItems.length > 0 && (
              <div className="bg-surface-container-low rounded-2xl p-6">
                <h3 className="font-serif text-lg font-bold text-primary mb-6">더 읽어보기</h3>
                <div className="space-y-8">
                  {sidebarItems.map((item) => (
                    <Link key={item.id} href={`/archive/${item.id}`} className="group cursor-pointer block">
                      <div className="aspect-video rounded-lg overflow-hidden mb-3">
                        {item.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.cover_image_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[item.category ?? ''] ?? 'from-primary to-[#1a4432]'} group-hover:scale-105 transition-transform duration-500`} />
                        )}
                      </div>
                      {item.category && (
                        <span className="text-[10px] text-secondary font-bold tracking-widest uppercase font-sans">
                          {item.category}
                        </span>
                      )}
                      <h4 className="font-serif font-bold text-primary mt-1 group-hover:text-secondary transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/archive"
                  className="block w-full mt-8 border border-primary/20 py-3 rounded-lg text-center text-xs font-bold text-primary uppercase tracking-widest hover:bg-primary hover:text-cream transition-all font-sans"
                >
                  전체 아카이브 보기
                </Link>
              </div>
            )}

            {/* CTA 카드 */}
            <div className="bg-primary p-8 rounded-2xl text-cream relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 opacity-10">
                <span className="material-symbols-outlined" style={{ fontSize: '10rem' }}>history_edu</span>
              </div>
              <h3 className="font-serif text-2xl font-bold mb-4 relative z-10">기록에 참여하세요</h3>
              <p className="text-sm text-cream/60 leading-relaxed mb-6 relative z-10 font-sans">
                광덕고등학교 학생이라면 누구나 자신의 글을 아카이브에 남길 수 있습니다.
              </p>
              <Link
                href="/write"
                className="inline-block bg-secondary text-cream px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest relative z-10 shadow-lg hover:bg-secondary/90 transition-colors font-sans"
              >
                글 올리기
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
