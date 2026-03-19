'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, User } from 'lucide-react'

const navLinks = [
  { href: '/', label: '홈' },
  { href: '/archive', label: '아카이브' },
  { href: '/magazine', label: '교지' },
  { href: '/write', label: '글쓰기' },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  // TODO: Supabase 인증 연동 후 교체
  const isLoggedIn = false

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
        <div className="hidden md:flex items-center">
          {isLoggedIn ? (
            <button className="w-9 h-9 rounded-full bg-[#D4A373] flex items-center justify-center text-[#1B4332]">
              <User size={18} />
            </button>
          ) : (
            <Link
              href="/login"
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
        <div className="md:hidden bg-[#163728] px-4 pb-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[#FEFAE0]/80 hover:text-[#D4A373] text-sm font-medium py-2 border-b border-[#1B4332] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <button className="flex items-center gap-2 text-[#D4A373] text-sm font-medium py-2">
              <User size={16} /> 프로필
            </button>
          ) : (
            <Link
              href="/login"
              className="mt-1 px-4 py-2 rounded-full border border-[#D4A373] text-[#D4A373] text-sm font-medium text-center hover:bg-[#D4A373] hover:text-[#1B4332] transition-colors"
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
