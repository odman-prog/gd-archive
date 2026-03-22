import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import ContentCard from '@/components/ContentCard'
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
    getContentList(supabase, true, 5),
    getContentList(supabase, false, 9),
  ])

  const mainFeatured = featured[0] ?? latest[0] ?? null
  const editorChoiceSecondary = featured.length >= 3 ? featured.slice(1, 3) : latest.slice(1, 3)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monthlyItems = latest.filter((item) => item.id !== mainFeatured?.id).slice(0, 3) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latestGrid = latest.filter((item) => item.id !== mainFeatured?.id).slice(3, 7) as any[]

  const currentYear = new Date().getFullYear()

  return (
    <div>

      {/* ── 히어로 섹션 ────────────────────────────── */}
      <section className="relative bg-cream overflow-hidden">
        {/* 배경 워터마크 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span
            className="font-serif font-black italic text-primary/[0.03] leading-none whitespace-nowrap"
            style={{ fontSize: 'clamp(120px, 20vw, 300px)' }}
          >
            광덕
          </span>
        </div>

        <div className="relative max-w-screen-2xl mx-auto px-6 md:px-12 pt-16 pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-stretch min-h-[480px] lg:min-h-[560px]">

            {/* 왼쪽: 에디토리얼 헤드라인 */}
            <div className="lg:col-span-6 flex flex-col justify-center pb-16 lg:pb-24">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary mb-6 font-sans block">
                {currentYear} · 광덕고등학교 교지편집부
              </span>
              <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold text-primary leading-[1.0] mb-8 tracking-tight">
                지성의<br />
                <em className="italic text-secondary not-italic" style={{ fontStyle: 'italic' }}>깊이를</em><br />
                기록하다
              </h1>
              <p className="text-base text-on-surface-variant max-w-md leading-relaxed font-sans mb-10">
                광덕고등학교 학생들의 사유와 표현이 모이는 공간.<br />
                우리의 이야기를 함께 써내려 갑니다.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/archive"
                  className="px-8 py-3.5 rounded-full bg-primary text-cream font-bold text-sm hover:bg-primary/90 transition-colors font-sans tracking-wide"
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

            {/* 오른쪽: 피처드 아티클 카드 */}
            <div className="lg:col-span-6 flex flex-col justify-end">
              {mainFeatured ? (
                <Link href={`/archive/${mainFeatured.id}`} className="group block relative rounded-t-2xl overflow-hidden h-[360px] lg:h-[480px]">
                  {/* 이미지 */}
                  {mainFeatured.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mainFeatured.cover_image_url}
                      alt={mainFeatured.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[mainFeatured.category ?? ''] ?? 'from-primary to-[#1a4432]'}`} />
                  )}
                  {/* 오버레이 카드 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary via-primary/80 to-transparent pt-16 pb-8 px-8">
                    {mainFeatured.category && (
                      <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-secondary font-sans block mb-2">
                        {mainFeatured.category}
                      </span>
                    )}
                    <h2 className="font-serif text-2xl font-bold text-cream leading-snug mb-2 line-clamp-2">
                      {mainFeatured.title}
                    </h2>
                    {mainFeatured.profiles && (
                      <p className="text-cream/60 text-xs font-sans">
                        {mainFeatured.profiles.name} · {format(new Date(mainFeatured.created_at), 'yyyy년 M월 d일', { locale: ko })}
                      </p>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="rounded-t-2xl bg-surface-container-low h-[360px] lg:h-[480px] flex items-center justify-center">
                  <div className="text-center text-primary/30">
                    <span className="material-symbols-outlined text-[48px]">menu_book</span>
                    <p className="text-sm font-sans mt-2">아직 등록된 글이 없습니다</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── 통계 스트립 ────────────────────────────── */}
      <div className="bg-primary">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-10">
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
                  <div className="font-serif text-3xl font-bold text-cream">{s.value}</div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-cream/40 font-sans mt-0.5">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 에디터스 초이스 ──────────────────────────── */}
      {(mainFeatured || editorChoiceSecondary.length > 0) && (
        <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary mb-1 font-sans">Editor&apos;s Choice</p>
              <h2 className="font-serif text-3xl font-bold text-primary">이달의 추천</h2>
            </div>
            <Link href="/archive" className="text-xs font-bold text-secondary hover:underline tracking-wide font-sans flex items-center gap-1">
              전체 보기
              <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 메인 피처 (8/12) */}
            {mainFeatured && (
              <Link href={`/archive/${mainFeatured.id}`} className="group lg:col-span-8 block relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:min-h-[480px]">
                {mainFeatured.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mainFeatured.cover_image_url}
                    alt={mainFeatured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[mainFeatured.category ?? ''] ?? 'from-primary to-[#1a4432]'} group-hover:scale-105 transition-transform duration-700`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  {mainFeatured.category && (
                    <span className="inline-block bg-secondary text-primary px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest font-sans mb-4">
                      {mainFeatured.category}
                    </span>
                  )}
                  <h3 className="font-serif text-3xl lg:text-4xl font-bold text-cream mb-3 leading-snug line-clamp-2">
                    {mainFeatured.title}
                  </h3>
                  {mainFeatured.summary && (
                    <p className="text-cream/70 text-sm leading-relaxed line-clamp-2 font-sans mb-4">
                      {mainFeatured.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold text-primary font-serif">
                      {mainFeatured.profiles?.name?.slice(0, 1) ?? '?'}
                    </div>
                    <span className="text-cream/60 text-xs font-sans">
                      {mainFeatured.profiles?.name} · {format(new Date(mainFeatured.created_at), 'M월 d일', { locale: ko })}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* 사이드 카드 2개 (4/12) */}
            {editorChoiceSecondary.length > 0 && (
              <div className="lg:col-span-4 flex flex-col gap-6">
                {editorChoiceSecondary.map((item) => (
                  <Link key={item.id} href={`/archive/${item.id}`} className="group block relative rounded-2xl overflow-hidden flex-1 min-h-[200px]">
                    {item.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.cover_image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        style={{ position: 'absolute', inset: 0 }}
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_GRADIENTS[item.category ?? ''] ?? 'from-primary to-[#1a4432]'} group-hover:scale-105 transition-transform duration-700`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      {item.category && (
                        <span className="text-[10px] font-bold tracking-widest uppercase text-secondary font-sans block mb-1">
                          {item.category}
                        </span>
                      )}
                      <h3 className="font-serif text-lg font-bold text-cream leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 이달의 글 (Monthly Review) ──────────────── */}
      {monthlyItems.length > 0 && (
        <section className="bg-surface-container-low py-20">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary mb-1 font-sans">Latest</p>
                <h2 className="font-serif text-3xl font-bold text-primary">최신 글</h2>
              </div>
              <Link href="/archive" className="text-xs font-bold text-secondary hover:underline tracking-wide font-sans flex items-center gap-1">
                전체 보기
                <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {monthlyItems.map((item, idx) => (
                <Link key={item.id} href={`/archive/${item.id}`} className="group">
                  <div className="bg-white rounded-2xl p-8 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-6">
                      {item.category ? (
                        <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest font-sans">
                          {item.category}
                        </span>
                      ) : <span />}
                      <span className="font-serif text-5xl font-bold text-primary/10 leading-none">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-primary mb-3 leading-snug line-clamp-2 group-hover:text-secondary transition-colors">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <blockquote className="text-on-surface-variant text-sm leading-relaxed line-clamp-3 font-sans italic flex-1 mb-6">
                        &ldquo;{item.summary}&rdquo;
                      </blockquote>
                    )}
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-outline-variant/20">
                      <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-[11px] font-bold text-primary font-serif">
                        {item.profiles?.name?.slice(0, 1) ?? '?'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary font-sans">{item.profiles?.name ?? '작성자'}</p>
                        <p className="text-[10px] text-on-surface-variant font-sans">
                          {format(new Date(item.created_at), 'yyyy.MM.dd', { locale: ko })}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 더 많은 글 그리드 ─────────────────────── */}
      {latestGrid.length > 0 && (
        <section className="max-w-screen-2xl mx-auto px-6 md:px-12 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary mb-1 font-sans">Archive</p>
              <h2 className="font-serif text-3xl font-bold text-primary">더 읽어보기</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {latestGrid.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        </section>
      )}

      {/* ── CTA 섹션 ──────────────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-6 md:px-12 pb-24">
        <div className="relative bg-primary rounded-[2rem] overflow-hidden p-12 md:p-20">
          {/* 배경 워터마크 */}
          <div className="absolute inset-0 flex items-center justify-end pointer-events-none select-none overflow-hidden pr-8">
            <span
              className="material-symbols-outlined text-cream/5"
              style={{ fontSize: '20rem' }}
            >
              history_edu
            </span>
          </div>

          <div className="relative z-10 max-w-2xl">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary mb-4 font-sans">Join Us</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-cream mb-6 leading-snug">
              기록에 참여하세요
            </h2>
            <p className="text-cream/60 text-base leading-relaxed font-sans mb-10">
              광덕고등학교 학생이라면 누구나 자신의 생각과 이야기를<br className="hidden md:block" />
              이 아카이브에 남길 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/write"
                className="px-8 py-4 rounded-full bg-secondary text-primary font-bold text-sm hover:bg-secondary/90 transition-colors font-sans tracking-wide"
              >
                글 올리기
              </Link>
              <Link
                href="/archive"
                className="px-8 py-4 rounded-full border border-cream/20 text-cream font-bold text-sm hover:bg-cream/10 transition-colors font-sans"
              >
                아카이브 둘러보기
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
