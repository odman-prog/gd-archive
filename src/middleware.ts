import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession()은 쿠키에서 로컬로 JWT를 읽으므로 Supabase 네트워크 요청이 없음
  // (실제 권한 검증은 각 route handler에서 getUser()로 수행)
  const { data: { session } } = await supabase.auth.getSession()

  // 미인증 사용자를 로그인 페이지로 리디렉트
  if (!session) {
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  // UI 경로에만 미들웨어 실행 (세션 쿠키 갱신 + 인증 게이트 역할)
  // API 경로는 각 route handler에서 직접 인증하므로 제외
  matcher: [
    '/admin/:path*',
    '/mypage/:path*',
    '/dashboard/:path*',
    '/write/:path*',
  ],
}
