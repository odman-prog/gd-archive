'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/',        icon: 'home',        label: '홈' },
  { href: '/archive', icon: 'search',       label: '아카이브' },
  { href: '/write',   icon: 'edit',         label: '기록하기' },
  { href: '/mypage',  icon: 'person',       label: '내 정보' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-2 pb-5 md:hidden backdrop-blur-xl bg-cream/90 border-t border-primary/5 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center rounded-xl px-4 py-2 min-w-[60px] transition-all duration-150 active:scale-90 ${
              active ? 'bg-primary text-cream' : 'text-primary/50'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-[10px] font-medium font-sans mt-0.5">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
