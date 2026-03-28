import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ReviewClient from './ReviewClient'

export const dynamic = 'force-dynamic'

export default async function ReviewPage() {
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
        <h1 className="text-xl font-bold text-primary">접근 권한 없음</h1>
        <p className="text-sm text-primary/60">교사 계정만 접근할 수 있는 페이지입니다.</p>
      </div>
    )
  }

  const { data: submissions } = await supabase
    .from('contents')
    .select('id, title, excerpt, category, created_at, author_id, cover_image_url, profiles!author_id(name, grade)')
    .eq('status', 'submitted')
    .order('created_at', { ascending: true })

  const { count: approvedCount } = await supabase
    .from('contents')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  const { count: pendingCount } = await supabase
    .from('contents')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'submitted')

  return (
    <ReviewClient
      teacherName={profile.name}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialSubmissions={(submissions ?? []) as any}
      stats={{ approved: approvedCount ?? 0, pending: pendingCount ?? 0 }}
    />
  )
}
