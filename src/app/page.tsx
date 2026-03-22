import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import ContentCard from '@/components/ContentCard'


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
      ; (pd ?? []).forEach((p) => { profileMap[p.id] = { name: p.name } })
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
    getContentList(supabase, true, 4),
    getContentList(supabase, false, 10),
  ])

  const mainFeatured = featured[0] ?? latest[0] ?? null
  const secondaryFeatured = featured[1] ?? latest[1] ?? null
  const excluded = latest.filter(
    (item) => item.id !== mainFeatured?.id && item.id !== secondaryFeatured?.id
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latestDispatch = excluded.slice(0, 2) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const moreItems = excluded.slice(2, 6) as any[]

  return (
    <div>

      {/* ── 히어로 섹션 ────────────────────────────── */}
      <section className="relative min-h-[70vh] flex flex-col justify-center overflow-hidden bg-primary text-cream pt-20">
        {/* 배경: 피처드 이미지 또는 기본 프리미엄 이미지 */}
        <div className="absolute inset-0 opacity-40">
          {mainFeatured?.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainFeatured.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-primary/50 to-primary/20" />
        </div>

        <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full mt-10 mb-16">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-secondary-container text-on-secondary-container font-sans text-xs tracking-widest uppercase rounded-full mb-6 shadow-sm">
              광덕고등학교 교지편집부
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold leading-[1.1] mb-6 tracking-tight drop-shadow-lg">
              The Editorial<br />
              <span className="italic font-normal">Archive</span>
            </h1>
            <p className="text-xl md:text-2xl font-serif text-cream/90 mb-10 max-w-xl italic drop-shadow-md">
              기록이 지성이 되는 공간
            </p>

            {/* 검색 바 */}
            <div className="max-w-2xl bg-surface/10 backdrop-blur-md border border-cream/20 rounded-full p-2 flex items-center shadow-2xl mb-8 transition-colors focus-within:bg-surface/20 focus-within:border-cream/40">
              <span className="material-symbols-outlined text-cream/70 ml-4">search</span>
              <form action="/archive" method="get" className="flex-1 flex">
                <input
                  type="text"
                  name="q"
                  placeholder="제목이나 키워드로 아카이브 검색..."
                  className="w-full bg-transparent border-none text-cream placeholder-cream/50 px-4 py-3 focus:outline-none font-sans text-lg"
                />
                <button type="submit" className="px-8 py-3 bg-cream text-primary font-bold rounded-full hover:bg-cream/90 transition-colors">
                  검색
                </button>
              </form>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/write"
                className="px-8 py-4 bg-transparent border border-cream/30 text-cream font-serif text-lg rounded-full hover:bg-cream/10 transition-all backdrop-blur-sm"
              >
                기록 남기기
              </Link>
            </div>
          </div>
        </div>

        {/* 퀵 카테고리 네비게이션 */}
        <div className="relative z-10 w-full bg-surface-container-low/80 backdrop-blur-md border-t border-cream/10 mt-auto">
          <div className="max-w-screen-2xl mx-auto px-8 py-6 flex flex-wrap gap-4 md:gap-12 justify-center md:justify-start">
            {[
              { label: '기사', icon: 'news' },
              { label: '에세이', icon: 'edit_document' },
              { label: '인터뷰', icon: 'mic' },
              { label: '시/수필', icon: 'menu_book' },
              { label: '독서감상문', icon: 'auto_stories' },
            ].map(cat => (
              <Link key={cat.label} href={`/archive?category=${cat.label}`} className="flex items-center gap-2.5 text-cream/70 hover:text-secondary transition-colors group">
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="font-sans font-medium">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 에디터스 초이스 ──────────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div className="max-w-xl">
              <span className="text-secondary font-sans text-sm uppercase tracking-[0.2em] mb-4 block">Curated Selection</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary italic">Editor&apos;s Choice</h2>
            </div>
            <Link href="/archive" className="text-primary font-sans text-sm font-bold border-b border-primary/20 pb-1 hover:border-primary transition-all">
              전체 글 보기
            </Link>
          </div>

          {(mainFeatured || secondaryFeatured) ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

              {/* 메인 피처 (7/12) */}
              {mainFeatured && (
                <Link href={`/archive/${mainFeatured.id}`} className="md:col-span-7 group cursor-pointer">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface-container-low mb-6">
                    {mainFeatured.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mainFeatured.cover_image_url}
                        alt={mainFeatured.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-container to-primary" />
                    )}
                    {mainFeatured.category && (
                      <div className="absolute top-6 left-6">
                        <span className="px-3 py-1 bg-primary text-cream font-sans text-[10px] tracking-widest uppercase rounded">
                          {mainFeatured.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    {mainFeatured.profiles && (
                      <p className="text-secondary font-sans text-xs uppercase tracking-widest mb-3">
                        {mainFeatured.profiles.name} · {format(new Date(mainFeatured.created_at), 'yyyy년 M월 d일', { locale: ko })}
                      </p>
                    )}
                    <h3 className="text-3xl font-serif font-bold text-primary mb-4 leading-snug group-hover:text-secondary transition-colors">
                      {mainFeatured.title}
                    </h3>
                    {mainFeatured.summary && (
                      <p className="text-on-surface/70 leading-relaxed max-w-2xl line-clamp-3 font-sans">
                        {mainFeatured.summary}
                      </p>
                    )}
                  </div>
                </Link>
              )}

              {/* 사이드 (5/12) */}
              <div className="md:col-span-5 flex flex-col gap-10">

                {/* 세컨더리 피처 */}
                {secondaryFeatured && (
                  <Link href={`/archive/${secondaryFeatured.id}`} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-xl bg-surface-container-low mb-6 max-h-64 aspect-[4/3] bg-primary">
                      {secondaryFeatured.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={secondaryFeatured.cover_image_url}
                          alt={secondaryFeatured.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-container to-primary" />
                      )}
                    </div>
                    <div>
                      <span className="text-secondary font-sans text-xs uppercase tracking-widest mb-2 block">이달의 추천</span>
                      <h3 className="text-2xl font-serif font-semibold text-primary mb-2 group-hover:text-secondary transition-colors line-clamp-2">
                        {secondaryFeatured.title}
                      </h3>
                      {secondaryFeatured.summary && (
                        <p className="text-on-surface/70 text-sm leading-relaxed line-clamp-2 font-sans">
                          {secondaryFeatured.summary}
                        </p>
                      )}
                    </div>
                  </Link>
                )}

                {/* 최신 디스패치 리스트 */}
                {latestDispatch.length > 0 && (
                  <div className="bg-surface-container-low shadow-sm p-8 rounded-xl border border-secondary/20 relative overflow-hidden group hover:border-secondary transition-colors">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-secondary/20 transition-colors" />
                    <h4 className="font-serif italic text-xl text-primary mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-secondary">schedule</span>최신 글
                    </h4>
                    <ul className="space-y-5 -mr-4 pr-4">
                      {latestDispatch.map((item) => (
                        <li key={item.id} className="group/item">
                          <Link href={`/archive/${item.id}`} className="flex flex-col gap-1.5 border-b border-primary/10 pb-4">
                            <div className="flex items-center gap-2">
                              {item.category && (
                                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-secondary bg-secondary/10 px-2 py-0.5 rounded">{item.category}</span>
                              )}
                              <span className="text-[10px] font-sans text-primary/40">{ko ? format(new Date(item.created_at), 'M.d') : ''}</span>
                            </div>
                            <p className="font-serif font-bold text-primary group-hover/item:text-secondary transition-colors line-clamp-2 md:line-clamp-1">{item.title}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link href="/archive" className="mt-5 text-xs font-bold font-sans text-secondary hover:underline flex items-center gap-1">전체보기 <span className="material-symbols-outlined text-[14px]">chevron_right</span></Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center gap-3 text-primary/30">
              <span className="material-symbols-outlined text-[40px]">menu_book</span>
              <p className="text-sm font-sans">아직 등록된 글이 없습니다. 첫 번째 글을 올려보세요!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── 통계 스트립 ────────────────────────────── */}
      <div className="bg-surface-container-low border-t border-outline-variant/20">
        <div className="max-w-screen-2xl mx-auto px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: '발행된 글', value: stats.contentCount.toLocaleString(), icon: 'article' },
              { label: '참여 학생', value: stats.studentCount.toLocaleString(), icon: 'group' },
              { label: '카테고리', value: '6', icon: 'category' },
              { label: '창간 연도', value: '2024', icon: 'history_edu' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <span className="material-symbols-outlined text-secondary text-[28px]">{s.icon}</span>
                <div>
                  <div className="font-serif text-3xl font-bold text-primary">{s.value}</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-primary/40 font-sans mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 더 읽어보기 그리드 ───────────────────────── */}
      {moreItems.length > 0 && (
        <section className="py-24 bg-surface">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-secondary font-sans text-sm uppercase tracking-[0.2em] mb-2 block">Archive</span>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary italic">더 읽어보기</h2>
              </div>
              <Link href="/archive" className="text-primary font-sans text-sm font-bold border-b border-primary/20 pb-1 hover:border-primary transition-all">
                전체 보기
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {moreItems.map((item) => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 최종 CTA ──────────────────────────────── */}
      <section className="py-32 bg-primary text-cream relative overflow-hidden flex items-center justify-center">

        <div className="max-w-4xl mx-auto px-8 text-center relative z-10 backdrop-blur-sm bg-primary/20 py-16 px-6 rounded-3xl border border-cream/10 shadow-2xl">
          <h2 className="text-4xl md:text-6xl font-serif italic mb-10 leading-tight drop-shadow-md">
            기록으로 남기고,<br />지성으로 이어지다.
          </h2>
          <div className="h-px w-24 bg-secondary/60 mx-auto mb-10" />
          <p className="text-lg md:text-xl font-serif text-cream/80 max-w-2xl mx-auto mb-12 italic drop-shadow">
            광덕아카이브는 단순한 데이터베이스가 아닙니다.<br />
            광덕고등학교의 지적 여정이 살아 숨쉬는 공간입니다.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/archive"
              className="inline-flex items-center gap-2 px-10 py-5 bg-cream text-primary font-sans font-bold uppercase tracking-[0.2em] text-sm rounded-full hover:bg-cream/90 transition-colors shadow-lg"
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              아카이브 입장
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
