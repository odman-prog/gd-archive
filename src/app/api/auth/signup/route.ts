import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// 서비스 롤 클라이언트 (서버에서만 사용)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase 환경변수 누락')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    const { name, loginId, grade, classNum, number, password } = await req.json()

    // 기본 유효성 검사
    if (!name || !loginId || !grade || !classNum || !number || !password) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(loginId)) {
      return NextResponse.json({ error: '아이디는 영문·숫자·_만 사용 가능하며 3~20자입니다.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
    }

    const supabase = getAdminClient()
    const email = `${loginId}@gd-archive.internal`

    // 중복 아이디 체크
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('student_id', loginId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 })
    }

    // Auth 계정 생성 (이메일 확인 없이 바로 활성화)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // 이메일 확인 건너뜀
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message ?? '계정 생성 실패' },
        { status: 500 }
      )
    }

    // profiles 테이블 저장
    const profileData: Record<string, unknown> = {
      id: authData.user.id,
      name,
      student_id: loginId,
      grade: Number(grade),
      number: Number(number),
      status: 'pending',
      role: 'student',
    }
    profileData['class'] = Number(classNum)
    const { error: profileError } = await supabase.from('profiles').insert(profileData)

    if (profileError) {
      // 롤백: 생성된 auth 계정 삭제
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: `프로필 저장 실패: ${profileError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '서버 오류'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
