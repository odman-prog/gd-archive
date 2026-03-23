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

  await supabase.auth.getUser()

  return response
}

export const config = {
  // 인증이 필요한 경로에만 미들웨어 실행 (공개 페이지 제외)
  matcher: [
    '/admin/:path*',
    '/mypage/:path*',
    '/dashboard/:path*',
    '/write/:path*',
    '/api/admin/:path*',
    '/api/content/:path*',
    '/api/dashboard/:path*',
    '/api/user/:path*',
  ],
}
