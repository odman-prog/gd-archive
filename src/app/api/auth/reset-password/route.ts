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
    const { studentId, name, grade, classNum, number, newPassword } = await req.json()

    if (!studentId?.trim() || !name?.trim() || !grade || !classNum || !number) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 })
    }
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('student_id', studentId.trim())
      .eq('name', name.trim())
      .eq('grade', Number(grade))
      .eq('class_num', Number(classNum))
      .eq('number', Number(number))
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: '입력 정보가 일치하지 않습니다.' }, { status: 404 })
    }

    const admin = getAdminClient()
    const { error } = await admin.auth.admin.updateUserById(profile.id, { password: newPassword })

    if (error) {
      return NextResponse.json({ error: '비밀번호 변경 실패: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
