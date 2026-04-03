import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

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
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id 누락' }, { status: 400 })

    // IP + 콘텐츠ID 기준 5분에 1회 제한 (같은 사람이 새로고침으로 조회수 뻥튀기 방지)
    const ip = getClientIp(req)
    if (!checkRateLimit(`view:${ip}:${id}`, 1, 5 * 60 * 1000)) {
      return NextResponse.json({ success: true }) // 조용히 무시
    }

    const admin = getAdminClient()
    const { error } = await admin.rpc('increment_view_count', { p_id: id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '서버 오류' }, { status: 500 })
  }
}
