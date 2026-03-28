import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // IP당 15분에 10회로 제한
    const ip = getClientIp(req)
    if (!checkRateLimit(`find-id:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const { name, grade, classNum, number } = await req.json()

    if (!name?.trim() || !grade || !classNum || !number) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 })
    }

    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('student_id')
      .eq('name', name.trim())
      .eq('grade', Number(grade))
      .eq('class', Number(classNum))
      .eq('number', Number(number))
      .maybeSingle()

    if (!data) {
      return NextResponse.json({ error: '일치하는 계정을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 학번 마스킹: 30201 → 3**01
    const sid = data.student_id
    const masked = sid.length >= 3
      ? sid[0] + '*'.repeat(sid.length - 2) + sid.slice(-1)
      : sid

    return NextResponse.json({ studentId: masked })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
