import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
          <ShieldAlert size={28} className="text-rose-400" />
        </div>
        <h1 className="text-xl font-bold text-[#1B4332]">접근 권한 없음</h1>
        <p className="text-sm text-[#1B4332]/60">교사 계정만 접근할 수 있는 페이지입니다.</p>
      </div>
    )
  }

  // 승인 대기 목록
  const { data: pendingProfiles } = await supabase
    .from('profiles')
    .select('id, name, student_id, grade, class_num, number, role, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  // 전체 사용자 (teacher 제외)
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, name, student_id, grade, class_num, number, role, status, created_at')
    .neq('status', 'pending')
    .order('created_at', { ascending: false })

  // 통계
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const [{ count: totalUsers }, { count: activeUsers }, { count: monthlyUploads }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('contents').select('id', { count: 'exact', head: true }).gte('created_at', thisMonth.toISOString()),
  ])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B4332]">관리자 페이지</h1>
        <p className="text-sm text-[#1B4332]/50 mt-1">{profile.name} 선생님</p>
      </div>

      <AdminClient
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialPending={(pendingProfiles ?? []) as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialUsers={(allUsers ?? []) as any}
        initialStats={{
          total: totalUsers ?? 0,
          active: activeUsers ?? 0,
          monthlyUploads: monthlyUploads ?? 0,
        }}
      />
    </div>
  )
}
