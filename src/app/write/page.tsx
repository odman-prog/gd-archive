import { redirect } from 'next/navigation'
import { Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import WriteForm from './WriteForm'

export default async function WritePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 비로그인 → 로그인 페이지로
  if (!user) redirect('/auth')

  // 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('status, name')
    .eq('id', user.id)
    .single()

  // 미승인 사용자 안내
  if (!profile || profile.status !== 'approved') {
    return (
      <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-[#775a19]/20 flex items-center justify-center">
          <Clock size={28} className="text-[#775a19]" />
        </div>
        <h1 className="text-xl font-bold text-[#012d1d]">승인 대기 중</h1>
        <p className="text-sm text-[#012d1d]/60 leading-relaxed">
          {profile?.name ? `${profile.name}님, ` : ''}담당 선생님의 승인 후 글을 올릴 수 있습니다.<br />
          승인은 영업일 기준 1~2일 소요될 수 있습니다.
        </p>
        <div className="mt-2 px-4 py-2 rounded-full bg-[#012d1d]/5 text-xs text-[#012d1d]/40">
          현재 상태: <span className="font-semibold text-[#775a19]">검토 중</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10 pb-6 border-b border-primary/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">New Entry</p>
        <h1 className="text-3xl font-serif font-bold text-primary">기록하기</h1>
        <p className="text-sm text-primary/45 mt-2 font-sans">작성한 글은 편집부 검토 후 아카이브에 게시됩니다.</p>
      </div>
      <WriteForm userId={user.id} />
    </div>
  )
}
