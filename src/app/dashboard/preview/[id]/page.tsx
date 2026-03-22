import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, FileText, User } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import { CATEGORY_COLORS } from '@/components/ContentCard'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: '임시저장', color: 'bg-gray-100 text-gray-500' },
  submitted: { label: '검토 대기', color: 'bg-blue-100 text-blue-700' },
  approved:  { label: '채택 완료', color: 'bg-emerald-100 text-emerald-700' },
  revision:  { label: '수정 요청', color: 'bg-amber-100 text-amber-700' },
  rejected:  { label: '반려', color: 'bg-rose-100 text-rose-500' },
  published: { label: '발행 완료', color: 'bg-[#012d1d]/10 text-[#012d1d]' },
}

export default async function DashboardPreviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowed = ['editor', 'chief_editor', 'teacher']
  if (!profile || !allowed.includes(profile.role)) notFound()

  const { data: content } = await supabase
    .from('contents')
    .select('id, title, excerpt, body, category, status, featured, created_at, author_id, file_url, file_name, reviewer_comment')
    .eq('id', params.id)
    .single()

  if (!content) notFound()

  // 저자 프로필
  let authorLabel = '알 수 없음'
  if (content.author_id) {
    const { data: author } = await supabase
      .from('profiles')
      .select('name, grade')
      .eq('id', content.author_id)
      .single()
    if (author) {
      authorLabel = author.grade ? `${author.name} · ${author.grade}학년` : author.name
    }
  }

  const categoryColor = CATEGORY_COLORS[content.category ?? ''] ?? CATEGORY_COLORS['기타']
  const statusMeta = STATUS_LABELS[content.status] ?? { label: content.status, color: 'bg-gray-100 text-gray-500' }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[#012d1d]/50 hover:text-[#012d1d] transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        대시보드로
      </Link>

      {/* 상태 뱃지 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusMeta.color}`}>
          {statusMeta.label}
        </span>
        {content.category && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>
            {content.category}
          </span>
        )}
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-[#012d1d] leading-tight mb-6">
        {content.title}
      </h1>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-full bg-[#012d1d]/10 flex items-center justify-center text-[#012d1d]/50">
          <User size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#012d1d]">{authorLabel}</p>
          <p className="text-xs text-[#012d1d]/40">
            {format(new Date(content.created_at), 'yyyy년 M월 d일', { locale: ko })}
          </p>
        </div>
      </div>

      <hr className="border-[#012d1d]/10 mb-8" />

      {/* 본문 / 요약 */}
      <div className="text-sm text-[#012d1d]/80 leading-relaxed whitespace-pre-wrap mb-10">
        {content.body ?? content.excerpt ?? (
          <span className="text-[#012d1d]/30 italic">본문 내용이 없습니다. 첨부파일을 확인하세요.</span>
        )}
      </div>

      {/* 첨부파일 */}
      {content.file_url && content.file_name && (
        <div className="mb-10 p-4 bg-white rounded-xl border border-[#012d1d]/10">
          <h3 className="text-sm font-semibold text-[#012d1d] mb-3 flex items-center gap-2">
            <FileText size={14} />
            첨부파일
          </h3>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[#012d1d] truncate">{content.file_name}</p>
            <a
              href={content.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#012d1d] text-[#fdf9ee] text-xs font-medium hover:bg-[#011f16] transition-colors"
            >
              <Download size={12} />
              열기 / 다운로드
            </a>
          </div>
        </div>
      )}

      {/* 수정 요청 코멘트 */}
      {content.reviewer_comment && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">편집부 코멘트</p>
          <p className="text-sm text-amber-800 whitespace-pre-wrap">{content.reviewer_comment}</p>
        </div>
      )}
    </div>
  )
}
