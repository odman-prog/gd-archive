import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, Download, FileText, User } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { CATEGORY_COLORS } from '@/components/ContentCard'
import LikeButton from './LikeButton'
import ViewTracker from './ViewTracker'

type Attachment = {
  id: string
  file_name: string
  storage_path: string
  file_size: number | null
}

export default async function ContentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // 현재 로그인 유저
  const { data: { user } } = await supabase.auth.getUser()

  // 콘텐츠 + 작성자 조회
  const { data: content } = await supabase
    .from('contents')
    .select(`
      id, title, summary, body, category, featured,
      view_count, like_count, created_at, author_id,
      profiles(name, grade, class_num)
    `)
    .eq('id', params.id)
    .eq('status', 'published')
    .single()

  if (!content) notFound()

  // 첨부파일 조회
  const { data: attachments } = await supabase
    .from('attachments')
    .select('id, file_name, storage_path, file_size')
    .eq('content_id', params.id)

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

  // 첨부파일 서명된 URL 생성
  const attachmentsWithUrl: (Attachment & { url: string })[] = await Promise.all(
    (attachments ?? []).map(async (att) => {
      const { data } = await supabase.storage
        .from('attachments')
        .createSignedUrl(att.storage_path, 60 * 60) // 1시간
      return { ...att, url: data?.signedUrl ?? '' }
    })
  )

  const profile = content.profiles as { name: string; grade?: number | null; class_num?: number | null } | null
  const categoryColor = CATEGORY_COLORS[content.category ?? ''] ?? CATEGORY_COLORS['기타']
  const authorLabel = profile
    ? [profile.name, profile.grade && profile.class_num ? `${profile.grade}학년 ${profile.class_num}반` : null]
        .filter(Boolean).join(' · ')
    : '알 수 없음'

  function formatFileSize(bytes: number | null) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <ViewTracker contentId={content.id} currentViews={content.view_count} />

      {/* 뒤로 가기 */}
      <Link
        href="/archive"
        className="inline-flex items-center gap-1.5 text-sm text-[#1B4332]/50 hover:text-[#1B4332] transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        목록으로
      </Link>

      {/* 태그 영역 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {content.category && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>
            {content.category}
          </span>
        )}
        {content.featured && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#D4A373]/20 text-[#D4A373]">
            ✦ 편집부 PICK
          </span>
        )}
      </div>

      {/* 제목 */}
      <h1 className="text-2xl md:text-3xl font-bold text-[#1B4332] leading-tight mb-6">
        {content.title}
      </h1>

      {/* 작성자 + 메타 */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1B4332]/10 flex items-center justify-center text-[#1B4332]/50">
            <User size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1B4332]">{authorLabel}</p>
            <p className="text-xs text-[#1B4332]/40">
              {format(new Date(content.created_at), 'yyyy년 M월 d일', { locale: ko })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#1B4332]/40">
          <span className="flex items-center gap-1.5">
            <Eye size={13} />
            조회 {content.view_count.toLocaleString()}
          </span>
        </div>
      </div>

      <hr className="border-[#1B4332]/10 mb-8" />

      {/* 본문 */}
      <div className="prose prose-sm max-w-none text-[#1B4332]/80 leading-relaxed whitespace-pre-wrap mb-10">
        {content.body ?? content.summary ?? '본문이 없습니다.'}
      </div>

      {/* 첨부파일 */}
      {attachmentsWithUrl.length > 0 && (
        <div className="mb-10">
          <h3 className="text-sm font-semibold text-[#1B4332] mb-3 flex items-center gap-2">
            <FileText size={14} />
            첨부파일 ({attachmentsWithUrl.length})
          </h3>
          <div className="flex flex-col gap-2">
            {attachmentsWithUrl.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-[#1B4332]/10 gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm text-[#1B4332] truncate">{att.file_name}</p>
                  {att.file_size && (
                    <p className="text-xs text-[#1B4332]/40">{formatFileSize(att.file_size)}</p>
                  )}
                </div>
                {att.url ? (
                  <a
                    href={att.url}
                    download={att.file_name}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B4332] text-[#FEFAE0] text-xs font-medium hover:bg-[#163728] transition-colors"
                  >
                    <Download size={12} />
                    다운로드
                  </a>
                ) : (
                  <span className="text-xs text-[#1B4332]/30">URL 만료</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 좋아요 버튼 */}
      <div className="flex justify-center pt-4 border-t border-[#1B4332]/10">
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
