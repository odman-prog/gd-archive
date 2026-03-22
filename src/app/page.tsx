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
    getContentList(supabase, true, 4),
    getContentList(supabase, false, 10),
  ])

  const mainFeatured = featured[0] ?? latest[0] ?? null
  const secondaryFeatured = featured[1] ?? latest[1] ?? null
  const excluded = latest.filter(
    (item) => item.id !== mainFeatured?.id && item.id !== secondaryFeatured?.id
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const moreItems = excluded.slice(0, 4) as any[]

  return (
    <div>

      {/* ── 히어로 섹션 ────────────────────────────── */}
      <section className="relative h-[870px] min-h-[600px] flex items-center overflow-hidden bg-primary">
        {/* 배경 이미지 */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-archive.png"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-8 md:px-16">
          <div className="max-w-3xl">
            <span className="font-sans text-secondary text-sm tracking-[0.2em] uppercase mb-4 block">
              광덕고등학교 교지편집부
            </span>
            <h1 className="font-serif italic text-6xl md:text-8xl text-cream font-light leading-tight mb-6">
              The Editorial Archive
            </h1>
            <p className="font-serif text-2xl md:text-3xl text-surface-container-low mb-12 opacity-90 italic">
              기록이 지성이 되는 공간
            </p>
            <div className="flex flex-wrap gap-6">
              <Link
                href="/archive"
                className="px-10 py-4 bg-primary-container text-cream rounded-lg font-serif text-lg hover:bg-secondary hover:text-cream transition-all duration-500 flex items-center gap-3 group shadow-xl"
              >
                아카이브 탐색
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <Link
                href="/write"
                className="px-10 py-4 border border-cream/20 text-cream rounded-lg font-sans text-sm tracking-widest uppercase hover:bg-cream/10 transition-all"
              >
                글 올리기
              </Link>
            </div>
          </div>
        </div>

      </section>

      {/* ── 에디터스 초이스 ──────────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-secondary font-sans text-xs tracking-[0.3em] uppercase mb-2 block">Curation</span>
              <h2 className="font-serif text-4xl md:text-5xl text-primary font-bold">Editor&apos;s Choice</h2>
            </div>
            <Link href="/archive" className="text-primary font-sans text-sm font-bold border-b border-primary/20 pb-1 hover:border-secondary transition-all">
              전체 글 보기
            </Link>
          </div>

          {(mainFeatured || secondaryFeatured) ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">

              {/* 메인 피처 (8/12) */}
              {mainFeatured && (
                <Link href={`/archive/${mainFeatured.id}`} className="md:col-span-8 group cursor-pointer">
                  <div className="relative overflow-hidden rounded-xl aspect-[16/9] mb-8 bg-surface-container-low">
                    {mainFeatured.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mainFeatured.cover_image_url}
                        alt={mainFeatured.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/hero-document.png"
                        alt="featured article"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                    )}
                    {mainFeatured.category && (
                      <div className="absolute top-6 left-6">
                        <span className="px-4 py-1.5 bg-secondary-container text-on-secondary-container text-[10px] font-sans font-bold tracking-widest uppercase rounded-full">
                          {mainFeatured.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="max-w-2xl">
                    {mainFeatured.profiles && (
                      <p className="text-secondary font-sans text-xs uppercase tracking-widest mb-3">
                        {mainFeatured.profiles.name} · {format(new Date(mainFeatured.created_at), 'yyyy년 M월 d일', { locale: ko })}
                      </p>
                    )}
                    <h3 className="font-serif text-4xl text-primary mb-4 leading-snug group-hover:text-secondary transition-colors">
                      {mainFeatured.title}
                    </h3>
                    {mainFeatured.summary && (
                      <p className="text-on-surface-variant font-sans leading-relaxed text-lg mb-6 line-clamp-2">
                        {mainFeatured.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm font-sans text-on-surface-variant/60">
                      <span>{mainFeatured.category ?? 'Editorial'}</span>
                      <span className="w-1 h-1 bg-outline-variant rounded-full" />
                      <span>{mainFeatured.view_count ?? 0} views</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* 사이드바 (4/12) */}
              <div className="md:col-span-4 flex flex-col gap-12">

                {/* 세컨더리 피처 */}
                {secondaryFeatured && (
                  <Link href={`/archive/${secondaryFeatured.id}`} className="group cursor-pointer">
                    <div className="aspect-[4/3] overflow-hidden rounded-xl mb-6 bg-surface-container-low">
                      {secondaryFeatured.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={secondaryFeatured.cover_image_url}
                          alt={secondaryFeatured.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src="/hero-archive.png"
                          alt="secondary featured"
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                      )}
                    </div>
                    {secondaryFeatured.category && (
                      <span className="text-secondary font-sans text-[10px] tracking-widest uppercase mb-2 block font-bold">
                        {secondaryFeatured.category}
                      </span>
                    )}
                    <h4 className="font-serif text-2xl text-primary mb-3 leading-snug group-hover:text-secondary transition-colors">
                      {secondaryFeatured.title}
                    </h4>
                    {secondaryFeatured.summary && (
                      <p className="text-on-surface-variant font-sans text-sm line-clamp-2 leading-relaxed">
                        {secondaryFeatured.summary}
                      </p>
                    )}
                  </Link>
                )}

                {/* 큐레이터 노트 */}
                <div className="p-8 bg-surface-container-low rounded-xl border-l-4 border-secondary">
                  <span className="material-symbols-outlined text-secondary mb-4 block">format_quote</span>
                  <p className="font-serif italic text-xl text-primary mb-6 leading-relaxed">
                    &ldquo;기록되지 않은 역사는 기억되지 않는다. 우리의 문장은 시대를 비추는 거울이 되어야 한다.&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-secondary/30" />
                    <span className="font-sans text-xs uppercase tracking-widest font-bold text-on-surface">Curator&apos;s Note</span>
                  </div>
                </div>
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

      {/* ── 아카이브 가치 섹션 ────────────────────────── */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            {/* 클린 2분할 이미지 레이아웃 */}
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-5 gap-4 h-[540px]">
                {/* 왼쪽 (3/5): hero-document.png 세로 전체 */}
                <div className="col-span-3 rounded-2xl overflow-hidden shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/hero-document.png"
                    alt="기록 문서"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                {/* 오른쪽 (2/5): 위 hero-logo + 아래 인용 카드 */}
                <div className="col-span-2 flex flex-col gap-4">
                  {/* 로고 카드 */}
                  <div className="flex-1 rounded-2xl bg-primary flex items-center justify-center p-8 shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/hero-logo.png"
                      alt="광덕고등학교"
                      className="w-full max-w-[140px] object-contain opacity-90"
                    />
                  </div>
                  {/* 인용 카드 */}
                  <div className="rounded-2xl bg-secondary-container px-6 py-5 shadow-sm">
                    <span className="material-symbols-outlined text-on-secondary-container text-[20px] mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
                    <p className="font-serif italic text-on-secondary-container text-sm leading-relaxed">
                      기록이 곧<br />지성이다
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 텍스트 */}
            <div className="order-1 lg:order-2">
              <span className="text-secondary font-sans text-xs tracking-[0.3em] uppercase mb-4 block">Archive Values</span>
              <h2 className="font-serif text-5xl md:text-6xl text-primary font-bold mb-8 leading-tight">
                Heritage in<br />Every Stroke.
              </h2>
              <p className="text-on-surface-variant font-sans text-lg mb-10 leading-relaxed max-w-lg">
                광덕 아카이브는 단순한 문서 보관소를 넘어, 학생들의 사유가 정제되어 기록으로 남는 지성의 전당입니다. 우리는 모든 창작물에 깃든 가치를 존중하며 이를 가장 품격 있게 큐레이팅합니다.
              </p>
              <ul className="space-y-6 mb-12">
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-secondary mt-1">history_edu</span>
                  <div>
                    <h5 className="font-serif text-xl text-primary">지속 가능한 기록</h5>
                    <p className="text-on-surface-variant text-sm mt-1">세대를 넘어 이어지는 광덕만의 고유한 서사적 유산</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-secondary mt-1">auto_awesome</span>
                  <div>
                    <h5 className="font-serif text-xl text-primary">엄격한 큐레이션</h5>
                    <p className="text-on-surface-variant text-sm mt-1">편집위원회에 의해 엄선된 수준 높은 학술 및 예술 콘텐츠</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-secondary mt-1">group</span>
                  <div>
                    <h5 className="font-serif text-xl text-primary">통계</h5>
                    <p className="text-on-surface-variant text-sm mt-1">
                      {stats.contentCount}편의 글 · {stats.studentCount}명의 참여 학생
                    </p>
                  </div>
                </li>
              </ul>
              <Link href="/archive" className="font-sans text-sm font-bold text-primary flex items-center gap-2 group">
                아카이브 전체 보기
                <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">trending_flat</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 더 읽어보기 ────────────────────────────── */}
      {moreItems.length > 0 && (
        <section className="py-24 bg-surface">
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-secondary font-sans text-xs tracking-[0.3em] uppercase mb-2 block">Archive</span>
                <h2 className="font-serif text-4xl text-primary font-bold">더 읽어보기</h2>
              </div>
              <Link href="/archive" className="text-primary font-sans text-sm font-bold border-b border-primary/20 pb-1 hover:border-secondary transition-all">
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
      <section className="py-16 bg-primary text-cream relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <h2 className="font-serif italic text-4xl md:text-6xl mb-10 leading-tight">
            기록으로 남기고,<br />지성으로 이어지다.
          </h2>
          <div className="h-px w-24 bg-secondary/40 mx-auto mb-10" />
          <p className="text-lg md:text-xl font-serif text-cream/60 max-w-2xl mx-auto mb-12 italic">
            광덕아카이브는 단순한 데이터베이스가 아닙니다.<br />
            광덕고등학교의 지적 여정이 살아 숨쉬는 공간입니다.
          </p>
          <Link
            href="/archive"
            className="inline-flex items-center gap-2 px-12 py-5 bg-surface text-primary font-sans font-bold uppercase tracking-[0.2em] text-sm rounded-full hover:bg-secondary-container transition-colors"
            style={{ boxShadow: '0 12px 32px -4px rgba(28,28,21,0.06)' }}
          >
            <span className="material-symbols-outlined text-[18px]">explore</span>
            아카이브 입장
          </Link>
        </div>
      </section>

    </div>
  )
}
