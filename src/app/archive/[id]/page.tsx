import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, FileText, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { CATEGORY_COLORS } from '@/components/ContentCard'
import LikeButton from './LikeButton'
import ViewTracker from './ViewTracker'

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: content } = await supabase
    .from('contents')
    .select('id, title, excerpt, body, category, featured, view_count, like_count, created_at, author_id, file_url, file_name, cover_image_url, tags, profiles!author_id(name, grade)')
    .eq('id', params.id)
    .eq('status', 'published')
    .single()

  if (!content) notFound()

  // author profile은 JOIN으로 이미 가져옴
  const authorProfile = (Array.isArray(content.profiles) ? content.profiles[0] : content.profiles) as { name: string; grade: number | null } | null
  const authorLabel = authorProfile?.name ?? '알 수 없음'
  const authorGrade = authorProfile?.grade ? `${authorProfile.grade}학년` : null

  // 좋아요 여부 + 관련 글 병렬 조회
  const [likeResult, relatedResult] = await Promise.all([
    user
      ? supabase.from('likes').select('id').eq('content_id', params.id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    content.category
      ? supabase
          .from('contents')
          .select('id, title, category, cover_image_url, created_at, author_id, profiles!author_id(name)')
          .eq('status', 'published')
          .eq('category', content.category)
          .neq('id', content.id)
          .order('created_at', { ascending: false })
          .limit(2)
      : Promise.resolve({ data: [] }),
  ])

  const isLiked = !!(likeResult as { data: unknown }).data

  const relatedRaw = (relatedResult as { data: unknown[] | null }).data ?? []
  const relatedItems = relatedRaw.map((r) => {
    const item = r as { id: string; title: string; category: string | null; cover_image_url: string | null; created_at: string; author_id: string; profiles: { name: string } | null }
    return { ...item, authorName: item.profiles?.name ?? '알 수 없음' }
  })

  const tags: string[] = Array.isArray(content.tags) ? content.tags : []
  const categoryColor = CATEGORY_COLORS[content.category ?? ''] ?? CATEGORY_COLORS['기타']

  const CATEGORY_GRADIENTS: Record<string, string> = {
    '기사':     'from-blue-950 to-blue-800',
    '에세이':   'from-emerald-950 to-emerald-800',
    '인터뷰':   'from-violet-950 to-violet-800',
    '시/수필':  'from-pink-950 to-pink-800',
    '독서감상문': 'from-amber-950 to-amber-800',
    '수행평가': 'from-orange-950 to-orange-800',
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
      <ViewTracker contentId={content.id} />

      {/* 뒤로 가기 */}
      <Link
        href="/archive"
        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-colors mb-12"
      >
        <ArrowLeft size={13} />
        아카이브
      </Link>

      <article className="max-w-3xl mx-auto">
        {/* ── 아티클 헤더 (중앙 정렬) ───────────────── */}
        <header className="mb-16 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {content.category && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase ${categoryColor}`}>
                {content.category}
              </span>
            )}
            {content.featured && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-secondary/15 text-secondary">
                ✦ 편집부 PICK
              </span>
            )}
          </div>

          <h1 className="font-serif text-5xl md:text-6xl leading-[1.1] text-primary tracking-tight font-bold">
            {content.title}
          </h1>

          <div className="flex justify-center items-center gap-3 text-sm font-medium text-primary/50 font-sans flex-wrap">
            <span>{authorLabel}{authorGrade ? ` · ${authorGrade}` : ''}</span>
            <span className="opacity-30">|</span>
            <span>{format(new Date(content.created_at), 'yyyy년 M월 d일', { locale: ko })}</span>
            <span className="opacity-30">|</span>
            <span className="flex items-center gap-1"><Eye size={13} /> {content.view_count.toLocaleString()}</span>
          </div>
        </header>

        {/* ── 커버 이미지 ────────────────────────────── */}
        <div className="relative w-full aspect-[16/9] mb-16 rounded-xl overflow-hidden shadow-xl">
          {content.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.cover_image_url}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENTS[content.category ?? ''] ?? 'from-primary to-[#1a4432]'}`} />
          )}
        </div>

        {/* ── 본문 ───────────────────────────────────── */}
        <section
          className="font-serif text-xl md:text-2xl leading-relaxed text-on-surface space-y-10 mb-16"
          style={{ fontFamily: 'Newsreader, Georgia, serif' }}
        >
          {(content.body ?? content.excerpt ?? '본문이 없습니다.')
            .split(/\n{2,}/)
            .map((para: string, i: number) => (
              <p
                key={i}
                className={i === 0 ? 'first-letter:text-7xl first-letter:font-bold first-letter:text-primary first-letter:mr-3 first-letter:float-left first-letter:leading-[0.85]' : ''}
              >
                {para.trim()}
              </p>
            ))}
        </section>

        {/* ── 첨부파일 ───────────────────────────────── */}
        {content.file_url && content.file_name && (
          <div className="mb-12 py-10 border-y border-outline-variant/20">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3 flex items-center gap-2 font-sans">
              <FileText size={12} />
              첨부파일
            </h3>
            <div className="flex items-center justify-between px-5 py-4 bg-surface rounded-xl border border-primary/8 gap-4">
              <p className="text-sm text-primary truncate font-sans">{content.file_name}</p>
              <a
                href={content.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download={content.file_name}
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-cream text-xs font-semibold hover:bg-primary/90 transition-colors font-sans"
              >
                <Download size={12} />
                다운로드
              </a>
            </div>
          </div>
        )}

        {/* ── 아티클 푸터 (태그 + 좋아요/공유) ─────────── */}
        <footer className="pt-10 border-t border-outline-variant/20 flex flex-wrap justify-between items-center gap-6">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="px-4 py-2 bg-surface rounded-lg text-sm text-primary font-medium font-sans">
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <LikeButton
              contentId={content.id}
              initialCount={content.like_count}
              initialLiked={isLiked}
              userId={user?.id ?? null}
            />
            <button
              onClick={undefined}
              className="flex items-center gap-2 px-4 py-2 hover:bg-surface rounded-lg transition-all text-sm font-medium text-primary/70 font-sans"
            >
              <span className="material-symbols-outlined text-[20px]">share</span>
              공유하기
            </button>
          </div>
        </footer>

        {/* ── 관련 글 ────────────────────────────────── */}
        {relatedItems.length > 0 && (
          <section className="mt-24 space-y-10">
            <div className="flex justify-between items-end">
              <h3 className="font-serif text-3xl text-primary">함께 읽어볼 만한 글</h3>
              <Link
                href={`/archive?category=${encodeURIComponent(content.category ?? '')}`}
                className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline font-sans"
              >
                관련 주제 더보기
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {relatedItems.map((item) => (
                <Link key={item.id} href={`/archive/${item.id}`} className="group cursor-pointer">
                  <div className="aspect-[16/10] rounded-xl overflow-hidden mb-4 shadow-sm">
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
                  <h4 className="font-serif text-xl text-primary leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-2 font-sans">
                    {item.category} | {item.authorName}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
