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

  const { data: { user } } = await supabase.auth.getUser()

  // 미인증 사용자를 로그인 페이지로 리디렉트
  if (!user) {
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
