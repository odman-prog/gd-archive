import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
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

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
