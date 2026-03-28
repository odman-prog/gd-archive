'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/',        icon: 'home',   label: '홈' },
  { href: '/archive', icon: 'search', label: '아카이브' },
  { href: '/write',   icon: 'edit',   label: '글 쓰기' },
  { href: '/mypage',  icon: 'person', label: '마이페이지' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
      <nav className="bg-primary/95 backdrop-blur-xl rounded-full py-3 px-6 flex justify-between items-center shadow-2xl">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 w-14 transition-all duration-150 active:scale-90"
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-colors ${active ? 'text-secondary' : 'text-cream/50'}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className={`text-[9px] font-sans tracking-wide transition-colors ${active ? 'text-secondary font-semibold' : 'text-cream/40'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
