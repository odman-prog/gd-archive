import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

const ALLOWED_ROLES = ['editor', 'chief_editor', 'teacher']

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!profile || !ALLOWED_ROLES.includes(profile.role ?? '')) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
          <ShieldAlert size={28} className="text-rose-400" />
        </div>
        <h1 className="text-xl font-bold text-[#1B4332]">접근 권한 없음</h1>
        <p className="text-sm text-[#1B4332]/60">편집부 구성원만 접근할 수 있는 페이지입니다.</p>
      </div>
    )
  }

  // 통계
  const [submitted, approvedStat, revision, published] = await Promise.all([
    supabase.from('contents').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('contents').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('contents').select('id', { count: 'exact', head: true }).eq('status', 'revision'),
    supabase.from('contents').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ])

  // 검토 대기 목록
  const { data: pendingData } = await supabase
    .from('contents')
    .select('id, title, category, status, featured, created_at, profiles(name, grade, class_num)')
    .eq('status', 'submitted')
    .order('created_at', { ascending: true })

  // 채택 완료 (발행 대기) 목록
  const { data: approvedData } = await supabase
    .from('contents')
    .select('id, title, category, status, featured, created_at, profiles(name, grade, class_num)')
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">편집부 대시보드</h1>
          <p className="text-sm text-[#1B4332]/50 mt-1">
            {profile.name} · {profile.role === 'teacher' ? '지도교사' : profile.role === 'chief_editor' ? '편집장' : '편집부원'}
          </p>
        </div>
      </div>

      <DashboardClient
        initialStats={{
          submitted: submitted.count ?? 0,
          approved: approvedStat.count ?? 0,
          revision: revision.count ?? 0,
          published: published.count ?? 0,
        }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialPending={(pendingData ?? []) as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialApproved={(approvedData ?? []) as any}
      />
    </div>
  )
}
