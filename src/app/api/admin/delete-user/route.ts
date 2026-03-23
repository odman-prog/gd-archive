import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase 환경변수 누락')
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    // 요청자가 teacher인지 확인
    const serverClient = createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const { data: profile } = await serverClient.from('profiles').select('role, student_id').eq('id', user.id).single()
    if (profile?.role !== 'teacher') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'userId 필요' }, { status: 400 })
    if (userId === user.id) return NextResponse.json({ error: '자기 자신은 삭제할 수 없습니다.' }, { status: 400 })

    // 삭제 대상이 교사인 경우 teacher01만 가능
    const admin = getAdminClient()
    const { data: target } = await admin.from('profiles').select('role').eq('id', userId).single()
    if (target?.role === 'teacher' && profile.student_id !== 'teacher01') {
      return NextResponse.json({ error: '교사 계정 삭제 권한이 없습니다.' }, { status: 403 })
    }

    // profiles 삭제 (auth.users cascade 전에 먼저)
    await admin.from('profiles').delete().eq('id', userId)

    // auth.users 삭제
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '서버 오류' }, { status: 500 })
  }
}
