import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const revalidate = 60 // 60초 ISR 캐싱 (공개 데이터만 사용)

type Post = {
  id: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  created_at: string
  profiles: { name: string | null } | null
}

export default async function LibraryPage() {
  const supabase = getAnonClient()

  const { data: posts } = await supabase
    .from('contents')
    .select('id, title, excerpt, cover_image_url, created_at, profiles!author_id(name)')
    .eq('category', '도서관')
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
            src="/jiw.png"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-950/90 via-teal-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface" />
        </div>
        <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-teal-400/20 text-teal-200 border border-teal-400/30 text-xs font-bold tracking-widest uppercase rounded-full mb-6 font-sans backdrop-blur-sm">
              학교 도서관 큐레이션
            </span>
            <h1 className="font-serif text-6xl md:text-8xl text-cream leading-[0.9] tracking-tighter mb-8">
              도서관<br /><span className="italic text-teal-300">서재</span>
            </h1>
            <div className="h-1 w-24 bg-teal-400 mb-8" />
            <p className="font-sans text-xl md:text-2xl text-cream/80 leading-relaxed max-w-lg">
              광덕고등학교 도서관이 엄선한 소식, 추천 도서, 독서 활동을 만나보세요.
            </p>
            <div className="flex gap-4 mt-10">
              <Link
                href="/archive?category=도서관"
                className="px-6 py-3 rounded-full bg-teal-400 text-teal-950 font-sans font-bold text-sm tracking-wide hover:bg-teal-300 transition-colors"
              >
                전체 글 보기
              </Link>
              <Link
                href="/write"
                className="px-6 py-3 rounded-full border border-cream/30 text-cream font-sans font-semibold text-sm tracking-wide hover:bg-cream/10 transition-colors"
              >
                글 쓰기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 인트로 ───────────────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-8 py-24">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          {/* 이미지 */}
          <div className="md:w-1/2 rounded-2xl overflow-hidden shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/f.png"
              alt="광덕고 도서관 추천 도서"
              className="w-full h-full object-cover"
            />
          </div>
          {/* 텍스트 */}
          <div className="md:w-1/2 md:pl-8">
            <span className="font-sans text-[10px] text-teal-600 font-bold tracking-[0.3em] uppercase mb-4 block">Our Library</span>
            <h2 className="font-serif text-4xl text-primary leading-tight mb-6">
              도서관의 의미:<br />지식의 보고
            </h2>
            <div className="h-px w-12 bg-teal-400 mb-6" />
            <p className="font-sans text-base text-on-surface-variant leading-relaxed mb-5">
              도서관은 단순히 책을 보관하는 공간이 아닙니다. 우리 학교 도서관은 학생들이 스스로 생각하고,
              질문하고, 탐구할 수 있는 지적 성장의 장입니다.
            </p>
            <p className="font-sans text-base text-on-surface-variant leading-relaxed mb-8">
              추천 도서, 독서 행사, 도서관 소식 등 다양한 콘텐츠를 통해 책과 함께하는 즐거움을 나눕니다.
              광덕의 도서관이 여러분의 지적 여정에 든든한 동반자가 되기를 바랍니다.
            </p>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="font-serif text-3xl text-teal-700 font-bold">책</p>
                <p className="font-sans text-xs text-on-surface-variant mt-1 tracking-widest">BOOKS</p>
              </div>
              <div className="w-px bg-outline-variant/30" />
              <div className="text-center">
                <p className="font-serif text-3xl text-teal-700 font-bold">소식</p>
                <p className="font-sans text-xs text-on-surface-variant mt-1 tracking-widest">NEWS</p>
              </div>
              <div className="w-px bg-outline-variant/30" />
              <div className="text-center">
                <p className="font-serif text-3xl text-teal-700 font-bold">활동</p>
                <p className="font-sans text-xs text-on-surface-variant mt-1 tracking-widest">ACTIVITY</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 큐레이션 벤토 그리드 ─────────────────── */}
      <section className="bg-surface-container-low py-32">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="font-sans text-teal-600 text-sm font-bold tracking-widest block mb-2 uppercase">Curated Collection</span>
              <h3 className="font-serif text-4xl text-primary">이달의 큐레이션</h3>
            </div>
            <Link href="/archive?category=도서관" className="font-sans text-primary hover:text-teal-600 transition-colors flex items-center gap-2 group text-sm font-bold">
              전체 보기
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          {safePost.length === 0 ? (
            /* 빈 상태 */
            <div className="relative rounded-3xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/jiw.png" alt="" className="w-full h-[420px] object-cover object-center brightness-50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <span className="material-symbols-outlined text-[56px] text-teal-300 block mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>local_library</span>
                <p className="font-serif text-3xl text-cream mb-3">아직 등록된 글이 없습니다</p>
                <p className="font-sans text-sm text-cream/70 mb-8">&apos;도서관&apos; 카테고리로 글을 작성하면 이곳에 표시됩니다.</p>
                <Link href="/write" className="bg-teal-400 px-8 py-3 rounded-full text-teal-950 font-sans font-bold text-sm tracking-widest hover:bg-teal-300 transition-colors">
                  첫 글 작성하기
                </Link>
              </div>
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
                          <div className="w-full h-full bg-teal-50 flex items-center justify-center min-h-[260px]">
                            <span className="material-symbols-outlined text-[64px] text-teal-300" style={{ fontVariationSettings: "'FILL' 1" }}>local_library</span>
                          </div>
                        )}
                      </div>
                      <div className="md:w-1/2 p-10 flex flex-col justify-between">
                        <div>
                          <div className="flex gap-2 mb-4">
                            <span className="px-3 py-1 bg-teal-100 text-teal-700 text-[10px] font-bold tracking-widest rounded-full uppercase font-sans">
                              도서관
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
                          <div className="w-8 h-8 rounded-full bg-teal-700 flex items-center justify-center text-[10px] text-cream font-bold font-sans">
                            {mainPost.profiles?.name?.slice(0, 2) ?? '도서'}
                          </div>
                          <span className="font-sans text-xs text-primary font-bold">
                            {mainPost.profiles?.name ?? '도서관'}
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
                        <div className="w-full h-full bg-teal-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[48px] text-teal-300" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-teal-100 text-teal-700 text-[10px] font-bold tracking-widest rounded-full uppercase italic font-sans">
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
                          {secondaryPost.profiles?.name ?? '도서관'}
                        </span>
                        <span
                          className="material-symbols-outlined text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >local_library</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* 추가 글 목록 (5/12) */}
              <div className="md:col-span-5">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-full">
                  <div className="p-10 h-full flex flex-col justify-between">
                    <div>
                      <span className="font-sans text-[10px] text-teal-600 font-bold tracking-[0.2em] uppercase mb-6 block">
                        Library Collection
                      </span>
                      <h4 className="font-serif text-2xl text-primary mb-4 leading-tight">
                        광덕 도서관이<br />큐레이션한 이야기
                      </h4>
                      {listPosts.length > 0 ? (
                        <ul className="space-y-3 mt-4">
                          {listPosts.map((p) => (
                            <li key={p.id}>
                              <Link href={`/archive/${p.id}`} className="font-sans text-sm text-primary hover:text-teal-600 transition-colors line-clamp-1">
                                · {p.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="font-sans text-on-surface-variant text-sm mb-8 leading-relaxed">
                          도서관과 관련된 소식과 이야기들이 이곳에 모입니다.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs font-sans mt-6">
                      <Link href="/archive?category=도서관" className="flex items-center gap-2 hover:text-teal-600 transition-colors">
                        전체 보기
                        <span className="material-symbols-outlined text-[16px]">bookmark</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA 카드 (7/12) */}
              <div className="md:col-span-7 relative overflow-hidden rounded-2xl group cursor-pointer min-h-[320px]">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-950 to-teal-800">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#5eead4,_transparent_70%)]" />
                </div>
                <div className="absolute inset-0 p-12 flex flex-col justify-center items-center text-center">
                  <h4 className="font-serif text-4xl text-cream mb-6 leading-snug">
                    책과 함께한<br />당신의 이야기를 들려주세요
                  </h4>
                  <p className="font-sans text-cream/70 max-w-md mb-8 text-sm leading-relaxed">
                    도서관 소식, 추천 도서, 독서 감상 등 책과 관련된 글을 자유롭게 공유해보세요.
                  </p>
                  <Link
                    href="/write"
                    className="bg-teal-400 px-8 py-3 rounded-full text-teal-950 font-sans font-bold text-sm tracking-widest hover:bg-teal-300 transition-colors"
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
            className="material-symbols-outlined text-[60px] text-teal-400/40 mb-8 block"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >format_quote</span>
          <blockquote className="font-serif text-3xl md:text-4xl text-primary italic leading-snug mb-10">
            &ldquo;책은 우리가 잠들었을 때도<br />우리를 위해 깨어 있다.&rdquo;
          </blockquote>
          <cite className="font-sans text-sm text-on-surface-variant not-italic tracking-[0.2em]">— Jorge Luis Borges</cite>
        </div>
      </section>

    </div>
  )
}
