import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { consumeResetToken } from '@/lib/reset-token'

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
    // IP당 15분에 5회로 제한
    const ip = getClientIp(req)
    if (!checkRateLimit(`reset-pw:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const { resetToken, newPassword } = await req.json()

    if (!resetToken) {
      return NextResponse.json({ error: '인증 토큰이 필요합니다. 본인 확인을 다시 진행해주세요.' }, { status: 400 })
    }
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 })
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: '비밀번호에 영문자와 숫자를 모두 포함해야 합니다.' }, { status: 400 })
    }

    // 토큰 소비 (1회용 + 만료 검증)
    const profileId = consumeResetToken(resetToken)
    if (!profileId) {
      return NextResponse.json({ error: '인증 토큰이 만료되었거나 유효하지 않습니다. 본인 확인을 다시 진행해주세요.' }, { status: 401 })
    }

    const admin = getAdminClient()
    const { error } = await admin.auth.admin.updateUserById(profileId, { password: newPassword })

    if (error) {
      return NextResponse.json({ error: '비밀번호 변경 실패: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
