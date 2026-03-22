import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id 누락' }, { status: 400 })

    // 본인 글이고 삭제 가능한 상태인지 확인
    const { data: content } = await supabase
      .from('contents')
      .select('id, author_id, status')
      .eq('id', id)
      .single()

    if (!content) return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
    if (content.author_id !== user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    if (!['draft', 'submitted', 'revision', 'rejected'].includes(content.status)) {
      return NextResponse.json({ error: '발행된 글은 삭제할 수 없습니다.' }, { status: 400 })
    }

    const { error } = await supabase.from('contents').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '서버 오류' }, { status: 500 })
  }
}
