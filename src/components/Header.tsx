'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X, Menu } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const supabase = createClient()

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/archive', label: '아카이브' },
  { href: '/magazine', label: '교지' },
  { href: '/teacher', label: '교사의 서재' },
  { href: '/write', label: '기록하기' },
]

const EDITOR_ROLES = ['editor', 'chief_editor', 'teacher']

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const fetchRole = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    setRole(data?.role ?? null)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchRole(user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchRole(session.user.id)
      else setRole(null)
    })

    return () => subscription.unsubscribe()
  }, [fetchRole])

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfileOpen(false)
    router.push('/')
    router.refresh()
  }

  const isEditor = EDITOR_ROLES.includes(role ?? '')
  const isTeacher = role === 'teacher'

  const allLinks = [
    ...navLinks,
    ...(isEditor ? [{ href: '/dashboard', label: '대시보드' }] : []),
  ]

  return (
    <header className="bg-cream/75 backdrop-blur-xl sticky top-0 z-50 border-b border-primary/10">
      <div className="max-w-screen-2xl mx-auto px-8 h-20 flex justify-between items-center">

        {/* 로고 */}
        <Link href="/" className="flex items-center group">
          <span className="text-2xl font-black font-serif italic text-primary tracking-tight" style={{ lineHeight: 1 }}>
            광덕아카이브
          </span>
        </Link>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden md:flex items-center gap-8">
          {allLinks.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wide font-sans pb-1 transition-colors ${
                  active
                    ? 'text-secondary font-bold border-b-2 border-secondary'
                    : 'text-primary/60 hover:text-primary font-medium'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* 우측 액션 */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/archive"
            className="p-2.5 rounded-full hover:bg-surface transition-colors text-primary/60 hover:text-primary"
            aria-label="검색"
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="p-2.5 rounded-full hover:bg-surface transition-colors text-primary/60 hover:text-primary"
                aria-label="프로필"
              >
                <span className="material-symbols-outlined text-[22px]">account_circle</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-14 bg-white rounded-2xl shadow-xl border border-primary/8 py-2 min-w-[180px] z-50">
                  <Link
                    href="/mypage"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-5 py-2.5 text-sm text-primary hover:bg-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    마이페이지
                  </Link>
                  {isEditor && (
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-5 py-2.5 text-sm text-primary hover:bg-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">dashboard</span>
                      편집부 대시보드
                    </Link>
                  )}
                  {isTeacher && (
                    <Link
                      href="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-5 py-2.5 text-sm text-primary hover:bg-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                      관리자 페이지
                    </Link>
                  )}
                  <hr className="my-1.5 border-primary/8" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-5 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="ml-2 px-5 py-2 rounded-full bg-primary text-cream text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              로그인
            </Link>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button
          className="md:hidden p-2 text-primary"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="메뉴"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {isOpen && (
        <div className="md:hidden bg-cream/95 backdrop-blur-xl border-t border-primary/8 px-8 pb-6 flex flex-col gap-0.5">
          {allLinks.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`py-3 border-b border-primary/8 text-sm font-sans tracking-wide transition-colors ${
                  active ? 'text-secondary font-bold' : 'text-primary/60 font-medium'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          {user ? (
            <>
              <Link href="/mypage" onClick={() => setIsOpen(false)} className="py-3 border-b border-primary/8 text-sm text-primary/60 font-medium">마이페이지</Link>
              {isTeacher && (
                <Link href="/admin" onClick={() => setIsOpen(false)} className="py-3 border-b border-primary/8 text-sm text-secondary font-semibold">관리자 페이지</Link>
              )}
              <button onClick={handleLogout} className="py-3 text-left text-sm text-rose-500 font-medium">로그아웃</button>
            </>
          ) : (
            <Link href="/auth" onClick={() => setIsOpen(false)} className="mt-3 px-5 py-2.5 rounded-full bg-primary text-cream text-sm font-semibold text-center">로그인</Link>
          )}
        </div>
      )}
    </header>
  )
}
