import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { createResetToken } from '@/lib/reset-token'

export async function POST(req: NextRequest) {
  try {
    // IP당 15분에 5회로 제한
    const ip = getClientIp(req)
    if (!checkRateLimit(`verify-identity:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const { studentId, name, grade, classNum, number } = await req.json()

    if (!studentId?.trim() || !name?.trim() || !grade || !classNum || !number) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 })
    }

    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('student_id', studentId.trim())
      .eq('name', name.trim())
      .eq('grade', Number(grade))
      .eq('class', Number(classNum))
      .eq('number', Number(number))
      .maybeSingle()

    if (!data) {
      return NextResponse.json({ error: '입력 정보가 일치하지 않습니다.' }, { status: 404 })
    }

    // 10분 유효 일회용 토큰 발급 → reset-password 에서 반드시 필요
    const resetToken = createResetToken(data.id)
    return NextResponse.json({ success: true, resetToken })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
