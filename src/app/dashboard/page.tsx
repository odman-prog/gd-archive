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
        <h1 className="text-xl font-bold text-[#012d1d]">접근 권한 없음</h1>
        <p className="text-sm text-[#012d1d]/60">편집부 구성원만 접근할 수 있는 페이지입니다.</p>
      </div>
    )
  }

  // 접수 대기 (submitted)
  const { data: submittedRaw } = await supabase
    .from('contents')
    .select('id, title, excerpt, body, category, status, created_at, author_id, file_url, file_name, reviewer_comment, resubmit_count')
    .eq('status', 'submitted')
    .order('created_at', { ascending: true })

  // 발행 완료 (published)
  const { data: publishedRaw } = await supabase
    .from('contents')
    .select('id, title, excerpt, body, category, status, created_at, author_id, file_url, file_name, reviewer_comment, resubmit_count, featured, cover_image_url')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  // 처리 완료 (revision + rejected)
  const { data: doneRaw } = await supabase
    .from('contents')
    .select('id, title, excerpt, body, category, status, created_at, author_id, file_url, file_name, reviewer_comment, resubmit_count')
    .in('status', ['revision', 'rejected'])
    .order('created_at', { ascending: false })

  // 저자 프로필 별도 조회
  const allIds = [
    ...(submittedRaw ?? []).map((c) => c.author_id),
    ...(publishedRaw ?? []).map((c) => c.author_id),
    ...(doneRaw ?? []).map((c) => c.author_id),
  ].filter(Boolean) as string[]
  const uniqueIds = allIds.filter((id, i, arr) => arr.indexOf(id) === i)

  const profileMap: Record<string, { name: string; grade: number | null }> = {}
  if (uniqueIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name, grade')
      .in('id', uniqueIds)
    ;(profilesData ?? []).forEach((p) => {
      profileMap[p.id] = { name: p.name, grade: p.grade ?? null }
    })
  }

  const submitted = (submittedRaw ?? []).map((c) => ({ ...c, author: profileMap[c.author_id] ?? null }))
  const published = (publishedRaw ?? []).map((c) => ({ ...c, author: profileMap[c.author_id] ?? null }))
  const done = (doneRaw ?? []).map((c) => ({ ...c, author: profileMap[c.author_id] ?? null }))

  // 교사용 제출 현황
  type StudentStat = {
    id: string; name: string; grade: number | null; class: number | null
    submitted: number; published: number; revision: number; rejected: number; draft: number
  }
  let studentStats: StudentStat[] = []

  if (profile.role === 'teacher') {
    const { data: allStudents } = await supabase
      .from('profiles')
      .select('id, name, grade, class')
      .eq('role', 'student')
      .eq('status', 'approved')
      .order('grade')

    if (allStudents && allStudents.length > 0) {
      const studentIds = allStudents.map((s) => s.id)
      const { data: allContents } = await supabase
        .from('contents')
        .select('author_id, status')
        .in('author_id', studentIds)

      const statMap: Record<string, Omit<StudentStat, 'id' | 'name' | 'grade' | 'class'>> = {}
      ;(allContents ?? []).forEach(({ author_id, status }) => {
        if (!statMap[author_id]) statMap[author_id] = { submitted: 0, published: 0, revision: 0, rejected: 0, draft: 0 }
        if (status === 'submitted') statMap[author_id].submitted++
        else if (status === 'published') statMap[author_id].published++
        else if (status === 'revision') statMap[author_id].revision++
        else if (status === 'rejected') statMap[author_id].rejected++
        else if (status === 'draft') statMap[author_id].draft++
      })

      studentStats = allStudents.map((s) => ({
        id: s.id, name: s.name, grade: s.grade ?? null, class: s.class ?? null,
        ...(statMap[s.id] ?? { submitted: 0, published: 0, revision: 0, rejected: 0, draft: 0 }),
      }))
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10 pb-6 border-b border-primary/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Editorial</p>
        <h1 className="text-3xl font-serif font-bold text-primary">편집부 대시보드</h1>
        <p className="text-sm text-primary/45 mt-1 font-sans">
          {profile.name} · {profile.role === 'teacher' ? '지도교사' : profile.role === 'chief_editor' ? '편집장' : '편집부원'}
        </p>
      </div>
      <DashboardClient
        submitted={submitted}
        published={published}
        done={done}
        role={profile.role ?? ''}
        studentStats={studentStats}
      />
    </div>
  )
}
