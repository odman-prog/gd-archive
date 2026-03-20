import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Eye, Heart, Clock, CheckCircle2, XCircle, MessageSquare, PenLine } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CATEGORY_COLORS } from '@/components/ContentCard'

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  draft:      { label: '임시저장', icon: <Clock size={12} />,        color: 'bg-gray-100 text-gray-500' },
  submitted:  { label: '검토 대기', icon: <Clock size={12} />,       color: 'bg-blue-100 text-blue-600' },
  revision:   { label: '수정 요청', icon: <MessageSquare size={12} />, color: 'bg-amber-100 text-amber-600' },
  approved:   { label: '채택',      icon: <CheckCircle2 size={12} />, color: 'bg-emerald-100 text-emerald-600' },
  published:  { label: '발행됨',    icon: <CheckCircle2 size={12} />, color: 'bg-[#1B4332]/10 text-[#1B4332]' },
  rejected:   { label: '반려',      icon: <XCircle size={12} />,     color: 'bg-rose-100 text-rose-500' },
}

export default async function MyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: profile }, { data: contents }] = await Promise.all([
    supabase.from('profiles').select('name, student_id, grade, class_num, number, status, role').eq('id', user.id).single(),
    supabase.from('contents').select('id, title, category, status, view_count, like_count, created_at, revision_comment').eq('author_id', user.id).order('created_at', { ascending: false }),
  ])

  if (!profile) redirect('/auth')

  const stats = {
    total: contents?.length ?? 0,
    published: contents?.filter((c) => c.status === 'published').length ?? 0,
    views: contents?.reduce((s, c) => s + (c.view_count ?? 0), 0) ?? 0,
    likes: contents?.reduce((s, c) => s + (c.like_count ?? 0), 0) ?? 0,
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* 프로필 카드 */}
      <div className="bg-white rounded-2xl border border-[#1B4332]/10 p-6 mb-8 flex items-start gap-5">
        <div className="w-14 h-14 rounded-full bg-[#1B4332] flex items-center justify-center text-[#FEFAE0] text-xl font-bold shrink-0">
          {profile.name?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[#1B4332]">{profile.name}</h1>
            {profile.status === 'approved' ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">승인됨</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">승인 대기</span>
            )}
          </div>
          <p className="text-sm text-[#1B4332]/50 mt-1">
            {profile.grade}학년 {profile.class_num}반 {profile.number}번 · 학번 {profile.student_id}
          </p>
        </div>
      </div>

      {/* 활동 통계 */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: '총 글', value: stats.total, icon: <FileText size={16} /> },
          { label: '발행됨', value: stats.published, icon: <CheckCircle2 size={16} /> },
          { label: '조회수', value: stats.views, icon: <Eye size={16} /> },
          { label: '좋아요', value: stats.likes, icon: <Heart size={16} /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#1B4332]/10 p-4 text-center flex flex-col items-center gap-1">
            <span className="text-[#D4A373]">{s.icon}</span>
            <p className="text-xl font-bold text-[#1B4332]">{s.value.toLocaleString()}</p>
            <p className="text-xs text-[#1B4332]/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 내 글 목록 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#1B4332]">내 글</h2>
        <Link href="/write" className="flex items-center gap-1.5 text-sm text-[#D4A373] hover:underline font-medium">
          <PenLine size={14} /> 새 글 쓰기
        </Link>
      </div>

      {!contents || contents.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-[#1B4332]/40">
          <FileText size={32} />
          <p className="text-sm">아직 작성한 글이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {contents.map((item) => {
            const st = STATUS_LABELS[item.status] ?? STATUS_LABELS['draft']
            const categoryColor = CATEGORY_COLORS[item.category ?? ''] ?? CATEGORY_COLORS['기타']
            return (
              <div key={item.id} className="bg-white rounded-xl border border-[#1B4332]/10 p-4 flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.category && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor}`}>{item.category}</span>
                    )}
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                      {st.icon}{st.label}
                    </span>
                  </div>
                  <span className="text-xs text-[#1B4332]/30 shrink-0">
                    {format(new Date(item.created_at), 'yy.MM.dd', { locale: ko })}
                  </span>
                </div>

                {item.status === 'published' ? (
                  <Link href={`/archive/${item.id}`} className="font-semibold text-[#1B4332] hover:text-[#D4A373] transition-colors">
                    {item.title}
                  </Link>
                ) : (
                  <p className="font-semibold text-[#1B4332]">{item.title}</p>
                )}

                {item.status === 'revision' && item.revision_comment && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700">
                    <span className="font-semibold">편집부 코멘트: </span>{item.revision_comment}
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-[#1B4332]/40">
                  <span className="flex items-center gap-1"><Eye size={11} />{item.view_count}</span>
                  <span className="flex items-center gap-1"><Heart size={11} />{item.like_count}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
