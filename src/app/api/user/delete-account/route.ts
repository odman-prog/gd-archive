import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase 환경변수 누락')
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST() {
  try {
    const serverClient = createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const admin = getAdminClient()

    // 연관 데이터 먼저 삭제 (FK 제약 해제)
    await admin.from('likes').delete().eq('user_id', user.id)
    await admin.from('contents').delete().eq('author_id', user.id)

    // 프로필 삭제
    await admin.from('profiles').delete().eq('id', user.id)

    // Auth 계정 삭제
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '서버 오류' }, { status: 500 })
  }
}
