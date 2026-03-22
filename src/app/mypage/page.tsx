import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Eye, Heart, CheckCircle2, PenLine } from 'lucide-react'
import MyContentList from './MyContentList'

export default async function MyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: profile }, { data: contents }] = await Promise.all([
    supabase.from('profiles').select('name, student_id, grade, class_num, number, status, role').eq('id', user.id).single(),
    supabase.from('contents')
      .select('id, title, category, status, view_count, like_count, created_at, reviewer_comment')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (!profile) redirect('/auth')

  const stats = {
    total: contents?.length ?? 0,
    published: contents?.filter((c) => c.status === 'published').length ?? 0,
    views: contents?.reduce((s, c) => s + (c.view_count ?? 0), 0) ?? 0,
    likes: contents?.reduce((s, c) => s + (c.like_count ?? 0), 0) ?? 0,
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* 프로필 카드 */}
      <div className="bg-white rounded-2xl border border-primary/8 p-6 mb-8 flex items-start gap-5">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-cream text-xl font-serif font-bold shrink-0">
          {profile.name?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-serif font-bold text-primary">{profile.name}</h1>
            {profile.status === 'approved' ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-bold uppercase tracking-wide">승인됨</span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold uppercase tracking-wide">승인 대기</span>
            )}
          </div>
          <p className="text-sm text-primary/45 mt-1 font-sans">
            {profile.grade ? `${profile.grade}학년` : ''}{profile.class_num ? ` ${profile.class_num}반` : ''}{profile.number ? ` ${profile.number}번` : ''}{profile.student_id ? ` · 학번 ${profile.student_id}` : ''}
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
          <div key={s.label} className="bg-white rounded-2xl border border-primary/8 p-4 text-center flex flex-col items-center gap-1">
            <span className="text-secondary">{s.icon}</span>
            <p className="text-xl font-serif font-bold text-primary">{s.value.toLocaleString()}</p>
            <p className="text-xs text-primary/40 font-sans">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 내 글 목록 */}
      <div className="flex items-center justify-between mb-5 border-b border-primary/10 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-0.5">My Works</p>
          <h2 className="text-lg font-serif font-bold text-primary">내 글</h2>
        </div>
        <Link href="/write" className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline uppercase tracking-wide">
          <PenLine size={13} /> 새 글 쓰기
        </Link>
      </div>

      <MyContentList initialContents={(contents ?? []) as Parameters<typeof MyContentList>[0]['initialContents']} />
    </div>
  )
}
