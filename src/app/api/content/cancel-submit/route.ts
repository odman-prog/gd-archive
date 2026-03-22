import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('환경변수 누락')
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id 누락' }, { status: 400 })

    // 본인 글이고 submitted 상태인지 확인
    const { data: content } = await supabase
      .from('contents')
      .select('id, author_id, status')
      .eq('id', id)
      .single()

    if (!content) return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 })
    if (content.author_id !== user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    if (content.status !== 'submitted') {
      return NextResponse.json({ error: '접수 대기 상태의 글만 취소할 수 있습니다.' }, { status: 400 })
    }

    // admin 클라이언트로 RLS 우회하여 업데이트
    const admin = getAdminClient()
    const { error } = await admin
      .from('contents')
      .update({ status: 'draft' })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '서버 오류' }, { status: 500 })
  }
}
