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
    getContentList(supabase, true, 4),
    getContentList(supabase, false, 10),
  ])

  const mainFeatured = featured[0] ?? latest[0] ?? null
  const secondaryFeatured = featured[1] ?? latest[1] ?? null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latestDispatch = latest.filter(
    (item) => item.id !== mainFeatured?.id && item.id !== secondaryFeatured?.id
  ).slice(0, 2) as any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const moreItems = latest.filter(
    (item) => item.id !== mainFeatured?.id && item.id !== secondaryFeatured?.id
  ).slice(2, 6) as any[]

  return (
    <div>

      {/* ── 히어로 섹션 ────────────────────────────── */}
      <section className="relative h-[870px] flex items-center overflow-hidden bg-primary text-cream">
        {/* 배경: 피처드 이미지 또는 그라데이션 */}
        <div className="absolute inset-0 opacity-40">
          {mainFeatured?.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainFeatured.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[mainFeatured?.category ?? ''] ?? 'from-primary-container to-primary'}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-secondary-container text-on-secondary-container font-sans text-xs tracking-widest uppercase rounded-full mb-6">
              광덕고등학교 교지편집부
            </span>
            <h1 className="text-6xl md:text-8xl font-serif font-bold leading-[1.1] mb-6 tracking-tight">
              The Editorial<br />
              <span className="italic font-normal">Archive</span>
            </h1>
            <p className="text-xl md:text-2xl font-serif text-cream/80 mb-10 max-w-xl italic">
              기록이 지성이 되는 공간
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/archive"
                className="px-8 py-4 bg-primary-container text-cream font-serif text-lg rounded-lg hover:bg-primary-container/90 transition-colors"
                style={{ boxShadow: '0 12px 32px -4px rgba(28,28,21,0.06)' }}
              >
                아카이브 탐색
              </Link>
              <Link
                href="/write"
                className="px-8 py-4 bg-transparent border border-cream/20 text-cream font-serif text-lg rounded-lg hover:bg-cream/5 transition-all"
              >
                글 올리기
              </Link>
            </div>
          </div>
        </div>

        {mainFeatured && (
          <div className="absolute bottom-12 right-8 text-right hidden md:block">
            <p className="font-sans text-xs uppercase tracking-widest text-cream/40 mb-2">Featured Publication</p>
            <p className="font-serif italic text-lg text-cream/70 line-clamp-1 max-w-xs">{mainFeatured.title}</p>
          </div>
        )}
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
                      <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[mainFeatured.category ?? ''] ?? 'from-primary to-[#1a4432]'} transition-transform duration-700 group-hover:scale-105`} />
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
                    <div className="relative overflow-hidden rounded-xl bg-surface-container-low mb-6 max-h-64 aspect-[4/3]">
                      {secondaryFeatured.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={secondaryFeatured.cover_image_url}
                          alt={secondaryFeatured.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[secondaryFeatured.category ?? ''] ?? 'from-primary to-[#1a4432]'} transition-transform duration-700 group-hover:scale-105`} />
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
                  <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-secondary">
                    <h4 className="font-serif italic text-xl text-primary mb-6">최신 글</h4>
                    <ul className="space-y-6">
                      {latestDispatch.map((item) => (
                        <li key={item.id} className="group">
                          <Link href={`/archive/${item.id}`} className="block">
                            {item.category && (
                              <p className="text-[10px] font-sans uppercase tracking-widest text-secondary mb-1">{item.category}</p>
                            )}
                            <p className="font-serif font-bold text-primary group-hover:underline line-clamp-1">{item.title}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
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
      <section className="py-32 bg-primary text-cream relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-serif italic mb-10 leading-tight">
            기록으로 남기고,<br />지성으로 이어지다.
          </h2>
          <div className="h-px w-24 bg-secondary/40 mx-auto mb-10" />
          <p className="text-lg md:text-xl font-serif text-cream/60 max-w-2xl mx-auto mb-12 italic">
            광덕아카이브는 단순한 데이터베이스가 아닙니다.<br />
            광덕고등학교의 지적 여정이 살아 숨쉬는 공간입니다.
          </p>
          <Link
            href="/archive"
            className="inline-block px-12 py-5 bg-surface text-primary font-sans font-bold uppercase tracking-[0.2em] text-sm rounded-full hover:bg-secondary-container transition-colors"
            style={{ boxShadow: '0 12px 32px -4px rgba(28,28,21,0.06)' }}
          >
            아카이브 입장
          </Link>
        </div>
      </section>

    </div>
  )
}
