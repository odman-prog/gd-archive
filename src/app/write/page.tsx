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
        <div className="w-16 h-16 rounded-full bg-[#D4A373]/20 flex items-center justify-center">
          <Clock size={28} className="text-[#D4A373]" />
        </div>
        <h1 className="text-xl font-bold text-[#1B4332]">승인 대기 중</h1>
        <p className="text-sm text-[#1B4332]/60 leading-relaxed">
          {profile?.name ? `${profile.name}님, ` : ''}담당 선생님의 승인 후 글을 올릴 수 있습니다.<br />
          승인은 영업일 기준 1~2일 소요될 수 있습니다.
        </p>
        <div className="mt-2 px-4 py-2 rounded-full bg-[#1B4332]/5 text-xs text-[#1B4332]/40">
          현재 상태: <span className="font-semibold text-[#D4A373]">검토 중</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B4332]">글 올리기</h1>
        <p className="text-sm text-[#1B4332]/50 mt-1">작성한 글은 편집부 검토 후 아카이브에 게시됩니다.</p>
      </div>
      <WriteForm userId={user.id} />
    </div>
  )
}
