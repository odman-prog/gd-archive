import type { Metadata } from 'next'
import './globals.css'
import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import InstallBanner from '@/components/InstallBanner'

// 사용자 역할을 60초간 캐시 → 매 페이지 로드마다 DB 호출 방지
const getCachedRole = unstable_cache(
  async (userId: string) => {
    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data } = await admin.from('profiles').select('role').eq('id', userId).single()
    return data?.role ?? null
  },
  ['user-role'],
  { revalidate: 60, tags: ['user-role'] }
)

export const metadata: Metadata = {
  title: '광덕아카이브',
  description: '광덕고등학교 국어과 교지편집부 아카이브',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '광덕아카이브',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // 서버에서 세션 미리 조회 → Header 초기 렌더에서 auth 깜빡임 방지
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  let initialRole: string | null = null
  if (session?.user) {
    initialRole = await getCachedRole(session.user.id)
  }

  const initialUser = session?.user
    ? { id: session.user.id, email: session.user.email }
    : null

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Manrope:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#012d1d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32-v3.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16-v3.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-v3.png" />
      </head>
      <body className="flex flex-col min-h-screen bg-cream font-sans">
        <Header initialUser={initialUser} initialRole={initialRole} />
        <main className="flex-1 pb-28 md:pb-0">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <InstallBanner />
      </body>
    </html>
  )
}
