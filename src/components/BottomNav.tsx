'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/',        icon: 'home' },
  { href: '/archive', icon: 'search' },
  { href: '/write',   icon: 'edit' },
  { href: '/mypage',  icon: 'person' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
      <nav className="bg-primary/95 backdrop-blur-xl rounded-full py-4 px-8 flex justify-between items-center shadow-2xl">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150 active:scale-90"
            >
              <span
                className={`material-symbols-outlined text-[24px] transition-colors ${active ? 'text-secondary' : 'text-cream/50'}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
