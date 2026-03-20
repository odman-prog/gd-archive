'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/archive', label: '아카이브' },
  { href: '/magazine', label: '교지' },
  { href: '/write', label: '글쓰기' },
]

const EDITOR_ROLES = ['editor', 'chief_editor', 'teacher']

export default function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) fetchRole(user.id)
    })

    // 인증 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchRole(session.user.id)
      else setRole(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId: string) {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
    setRole(data?.role ?? null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfileOpen(false)
    router.push('/')
    router.refresh()
  }

  const isEditor = EDITOR_ROLES.includes(role ?? '')

  return (
    <header className="sticky top-0 z-50 bg-[#1B4332] shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 text-[#FEFAE0] font-bold text-xl tracking-tight">
          <span>📚</span>
          <span>광덕아카이브</span>
        </Link>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#FEFAE0]/80 hover:text-[#D4A373] text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 우측: 로그인/프로필 */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="w-9 h-9 rounded-full bg-[#D4A373] flex items-center justify-center text-[#1B4332] hover:bg-[#c49060] transition-colors"
              >
                <User size={18} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 bg-white rounded-xl shadow-lg border border-[#1B4332]/10 py-1.5 min-w-[160px] z-50">
                  <Link
                    href="/mypage"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1B4332] hover:bg-[#FEFAE0] transition-colors"
                  >
                    <User size={14} /> 마이페이지
                  </Link>
                  {isEditor && (
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#1B4332] hover:bg-[#FEFAE0] transition-colors"
                    >
                      <LayoutDashboard size={14} /> 편집부 대시보드
                    </Link>
                  )}
                  <hr className="my-1 border-[#1B4332]/10" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut size={14} /> 로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-1.5 rounded-full border border-[#D4A373] text-[#D4A373] text-sm font-medium hover:bg-[#D4A373] hover:text-[#1B4332] transition-colors"
            >
              로그인
            </Link>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button
          className="md:hidden text-[#FEFAE0]"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="메뉴"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {isOpen && (
        <div className="md:hidden bg-[#163728] px-4 pb-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#FEFAE0]/80 hover:text-[#D4A373] text-sm font-medium py-2.5 border-b border-[#1B4332] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/mypage" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-[#FEFAE0]/80 text-sm font-medium py-2.5 border-b border-[#1B4332]">
                <User size={15} /> 마이페이지
              </Link>
              {isEditor && (
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-[#D4A373] text-sm font-medium py-2.5 border-b border-[#1B4332]">
                  <LayoutDashboard size={15} /> 편집부 대시보드
                </Link>
              )}
              <button onClick={handleLogout} className="flex items-center gap-2 text-rose-400 text-sm font-medium py-2.5">
                <LogOut size={15} /> 로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="mt-2 px-4 py-2 rounded-full border border-[#D4A373] text-[#D4A373] text-sm font-medium text-center hover:bg-[#D4A373] hover:text-[#1B4332] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              로그인
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
