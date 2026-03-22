import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, Download, FileText, User } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { CATEGORY_COLORS } from '@/components/ContentCard'
import LikeButton from './LikeButton'
import ViewTracker from './ViewTracker'

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 콘텐츠 조회 (profiles 조인 없이)
  const { data: content } = await supabase
    .from('contents')
    .select('id, title, excerpt, body, category, featured, view_count, like_count, created_at, author_id, file_url, file_name')
    .eq('id', params.id)
    .eq('status', 'published')
    .single()

  if (!content) notFound()

  // 저자 프로필 별도 조회
  let authorLabel = '알 수 없음'
  if (content.author_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, grade')
      .eq('id', content.author_id)
      .single()
    if (profile) {
      authorLabel = profile.grade ? `${profile.name} · ${profile.grade}학년` : profile.name
    }
  }

  // 로그인 유저가 좋아요 눌렀는지 확인
  let isLiked = false
  if (user) {
    const { data: like } = await supabase
      .from('likes')
      .select('id')
      .eq('content_id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()
    isLiked = !!like
  }

  const categoryColor = CATEGORY_COLORS[content.category ?? ''] ?? CATEGORY_COLORS['기타']

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <ViewTracker contentId={content.id} currentViews={content.view_count} />

      <Link
        href="/archive"
        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-colors mb-10"
      >
        <ArrowLeft size={13} />
        아카이브
      </Link>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        {content.category && (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${categoryColor}`}>
            {content.category}
          </span>
        )}
        {content.featured && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary/15 text-secondary uppercase tracking-wider">
            ✦ 편집부 PICK
          </span>
        )}
      </div>

      <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary leading-tight mb-6">
        {content.title}
      </h1>

      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center text-primary/40">
            <User size={15} />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">{authorLabel}</p>
            <p className="text-xs text-primary/40 font-sans">
              {format(new Date(content.created_at), 'yyyy년 M월 d일', { locale: ko })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-primary/35 font-sans">
          <span className="flex items-center gap-1.5">
            <Eye size={12} />
            조회 {content.view_count.toLocaleString()}
          </span>
        </div>
      </div>

      <hr className="border-primary/10 mb-10" />

      {/* 본문 */}
      <div className="font-serif text-lg leading-[1.9] text-primary/75 whitespace-pre-wrap mb-12">
        {content.body ?? content.excerpt ?? '본문이 없습니다.'}
      </div>

      {/* 첨부파일 */}
      {content.file_url && content.file_name && (
        <div className="mb-10">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3 flex items-center gap-2">
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
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-cream text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Download size={12} />
              다운로드
            </a>
          </div>
        </div>
      )}

      <div className="flex justify-center pt-6 border-t border-primary/10">
        <LikeButton
          contentId={content.id}
          initialCount={content.like_count}
          initialLiked={isLiked}
          userId={user?.id ?? null}
        />
      </div>
    </div>
  )
}
