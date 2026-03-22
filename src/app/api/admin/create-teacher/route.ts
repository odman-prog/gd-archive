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

    const { data: profile } = await serverClient.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'teacher') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    const { name, loginId, password } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
    if (!loginId?.trim()) return NextResponse.json({ error: '로그인 ID를 입력해주세요.' }, { status: 400 })
    if (!password || password.length < 6) return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })

    const admin = getAdminClient()

    // 이메일 형식으로 변환 (loginId@school.internal)
    const email = `${loginId.trim()}@school.internal`

    // auth user 생성
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        return NextResponse.json({ error: '이미 사용 중인 로그인 ID입니다.' }, { status: 400 })
      }
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const newUserId = authData.user.id

    // profiles 테이블에 교사 프로필 생성
    const { error: profileError } = await admin.from('profiles').insert({
      id: newUserId,
      name: name.trim(),
      student_id: loginId.trim(),
      grade: null,
      class_num: null,
      number: null,
      role: 'teacher',
      status: 'approved',
    })

    if (profileError) {
      // 프로필 생성 실패 시 auth user도 롤백
      await admin.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: '프로필 생성 실패: ' + profileError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUserId,
        name: name.trim(),
        student_id: loginId.trim(),
        role: 'teacher',
        status: 'approved',
        created_at: new Date().toISOString(),
        grade: null,
        class_num: null,
        number: null,
      },
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '서버 오류' }, { status: 500 })
  }
}
