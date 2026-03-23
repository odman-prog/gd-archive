import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

type Post = {
  id: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  created_at: string
  profiles: { name: string | null } | null
}

export default async function TeacherPage() {
  const supabase = createClient()

  const { data: posts } = await supabase
    .from('contents')
    .select('id, title, excerpt, cover_image_url, created_at, profiles(name)')
    .eq('category', '교사의 서재')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(10)

  const safePost = (posts ?? []) as unknown as Post[]
  const mainPost = safePost[0] ?? null
  const secondaryPost = safePost[1] ?? null
  const listPosts = safePost.slice(2, 5)

  return (
    <div className="bg-surface">

      {/* ── 히어로 ───────────────────────────────── */}
      <section className="relative min-h-[716px] flex items-center pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-archive.png"
            alt=""
            className="w-full h-full object-cover brightness-[0.85] contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/20 to-surface" />
        </div>
        <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest uppercase rounded-full mb-6 font-sans">
              교사진 공유 큐레이션
            </span>
            <h1 className="font-serif text-6xl md:text-8xl text-primary leading-[0.9] tracking-tighter mb-8">
              교사의<br /><span className="italic">서재</span>
            </h1>
            <div className="h-1 w-24 bg-secondary mb-8" />
            <p className="font-sans text-xl md:text-2xl text-on-surface leading-relaxed max-w-lg">
              Gwangdeok faculty shares the wisdom and philosophical texts that define our academic spirit.
            </p>
          </div>
        </div>
      </section>

      {/* ── 인트로 ───────────────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-8 py-24">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          <div className="md:w-1/3">
            <h2 className="font-serif text-3xl text-primary leading-tight">
              서재의 의미:<br />지혜의 공명
            </h2>
          </div>
          <div className="md:w-2/3 border-l border-outline-variant/30 pl-12">
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed mb-6">
              이곳은 단순한 도서 목록을 넘어, 우리 교육 공동체가 지향하는 가치와 철학이 담긴 지적 거점입니다.
              국어과 교사진이 엄선한 텍스트들은 교실 안의 지식을 넘어 삶을 관통하는 통찰을 제안합니다.
            </p>
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed">
              우리는 문장을 통해 대화하고, 페이지 사이에서 새로운 교육적 영감을 발견합니다.
              광덕의 교사들이 사랑하고 아끼는 문장들이 학생들의 성장에 소중한 밑거름이 되기를 바랍니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 큐레이션 벤토 그리드 ─────────────────── */}
      <section className="bg-surface-container-low py-32">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="font-sans text-secondary text-sm font-bold tracking-widest block mb-2 uppercase">Curated Collection</span>
              <h3 className="font-serif text-4xl text-primary">이달의 큐레이션</h3>
            </div>
            <Link href="/archive?category=교사의 서재" className="font-sans text-primary hover:text-secondary transition-colors flex items-center gap-2 group text-sm font-bold">
              전체 보기
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          {safePost.length === 0 ? (
            /* 빈 상태 */
            <div className="text-center py-24">
              <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 block mb-4">auto_stories</span>
              <p className="font-serif text-2xl text-primary mb-3">아직 등록된 글이 없습니다</p>
              <p className="font-sans text-sm text-on-surface-variant mb-8">교사가 &apos;교사의 서재&apos; 카테고리로 글을 작성하면 이곳에 표시됩니다.</p>
              <Link href="/write" className="bg-secondary px-8 py-3 rounded-full text-cream font-sans font-bold text-sm tracking-widest hover:bg-secondary/90 transition-colors">
                글 작성하기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

              {/* 피처드 카드 (8/12) */}
              {mainPost && (
                <Link href={`/archive/${mainPost.id}`} className="md:col-span-8 group cursor-pointer">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 h-full">
                    <div className="flex flex-col md:flex-row h-full">
                      <div className="md:w-1/2 aspect-[4/3] md:aspect-auto overflow-hidden">
                        {mainPost.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mainPost.cover_image_url}
                            alt={mainPost.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary-container flex items-center justify-center min-h-[260px]">
                            <span className="material-symbols-outlined text-[64px] text-on-primary-container/40" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                          </div>
                        )}
                      </div>
                      <div className="md:w-1/2 p-10 flex flex-col justify-between">
                        <div>
                          <div className="flex gap-2 mb-4">
                            <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold tracking-widest rounded-full uppercase font-sans">
                              교사의 서재
                            </span>
                          </div>
                          <h4 className="font-serif text-3xl text-primary mb-4 leading-tight">
                            {mainPost.title}
                          </h4>
                          {mainPost.excerpt && (
                            <p className="font-sans text-on-surface-variant text-sm line-clamp-3 mb-6 leading-relaxed">
                              {mainPost.excerpt}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] text-cream font-bold font-sans">
                            {mainPost.profiles?.name?.slice(0, 2) ?? '선생'}
                          </div>
                          <span className="font-sans text-xs text-primary font-bold">
                            {mainPost.profiles?.name ?? '선생님'} 추천
                          </span>
                          <span className="font-sans text-xs text-on-surface-variant ml-auto">
                            {format(new Date(mainPost.created_at), 'yyyy.MM.dd', { locale: ko })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* 세컨더리 카드 (4/12) */}
              {secondaryPost && (
                <Link href={`/archive/${secondaryPost.id}`} className="md:col-span-4 group cursor-pointer">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 h-full flex flex-col">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      {secondaryPost.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={secondaryPost.cover_image_url}
                          alt={secondaryPost.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-secondary-container flex items-center justify-center">
                          <span className="material-symbols-outlined text-[48px] text-on-secondary-container/40" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold tracking-widest rounded-full uppercase italic font-sans">
                          Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-8 flex-grow flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-2xl text-primary mb-4 leading-tight">{secondaryPost.title}</h4>
                        {secondaryPost.excerpt && (
                          <p className="font-sans text-on-surface-variant text-sm line-clamp-2 leading-relaxed">
                            {secondaryPost.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <span className="font-sans text-[10px] text-on-surface-variant font-medium uppercase tracking-widest">
                          {secondaryPost.profiles?.name ?? '선생님'}
                        </span>
                        <span
                          className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >auto_stories</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* 추가 글 목록 (5/12) — 없으면 기본 텍스트 카드 */}
              <div className="md:col-span-5">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-full">
                  <div className="p-10 h-full flex flex-col justify-between">
                    <div>
                      <span className="font-sans text-[10px] text-secondary font-bold tracking-[0.2em] uppercase mb-6 block">
                        Legacy Collection
                      </span>
                      <h4 className="font-serif text-2xl text-primary mb-4 leading-tight">
                        광덕의 정신을 잇는<br />교사의 서재
                      </h4>
                      {listPosts.length > 0 ? (
                        <ul className="space-y-3 mt-4">
                          {listPosts.map((p) => (
                            <li key={p.id}>
                              <Link href={`/archive/${p.id}`} className="font-sans text-sm text-primary hover:text-secondary transition-colors line-clamp-1">
                                · {p.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="font-sans text-on-surface-variant text-sm mb-8 leading-relaxed">
                          교사들이 작성한 서재 글들이 이곳에 모입니다.
                          세대를 넘어 공유되는 가치의 원천입니다.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs font-sans mt-6">
                      <Link href="/archive?category=교사의 서재" className="flex items-center gap-2 hover:text-secondary transition-colors">
                        전체 보기
                        <span className="material-symbols-outlined text-[16px]">bookmark</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA 카드 (7/12) */}
              <div className="md:col-span-7 relative overflow-hidden rounded-2xl group cursor-pointer min-h-[320px]">
                <div className="absolute inset-0 bg-primary-container">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#fed488,_transparent_70%)]" />
                </div>
                <div className="absolute inset-0 p-12 flex flex-col justify-center items-center text-center">
                  <h4 className="font-serif text-4xl text-cream mb-6 leading-snug">
                    여러분의 서재에는<br />어떤 문장이 남아있나요?
                  </h4>
                  <p className="font-sans text-on-primary-container max-w-md mb-8 text-sm leading-relaxed">
                    교사들이 추천한 책을 읽고 남긴 여러분의 감상을 공유해주세요.
                    훌륭한 리뷰는 아카이브에 영구히 기록됩니다.
                  </p>
                  <Link
                    href="/write"
                    className="bg-secondary px-8 py-3 rounded-full text-cream font-sans font-bold text-sm tracking-widest hover:bg-secondary/90 transition-colors"
                  >
                    참여하기
                  </Link>
                </div>
              </div>

            </div>
          )}
        </div>
      </section>

      {/* ── 시그니처 인용구 ──────────────────────── */}
      <section className="py-32 bg-surface">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <span
            className="material-symbols-outlined text-[60px] text-secondary/30 mb-8 block"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >format_quote</span>
          <blockquote className="font-serif text-3xl md:text-4xl text-primary italic leading-snug mb-10">
            &ldquo;교육은 양동이를 채우는 것이 아니라,<br />불을 지피는 것이다.&rdquo;
          </blockquote>
          <cite className="font-sans text-sm text-on-surface-variant not-italic tracking-[0.2em]">— W.B. Yeats</cite>
        </div>
      </section>

    </div>
  )
}
