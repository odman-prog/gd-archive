import Link from 'next/link'
import FooterActions from './FooterActions'

export default function Footer() {
  return (
    <footer className="bg-primary text-cream">
      <div className="max-w-screen-2xl mx-auto px-8 md:px-12 pt-16 pb-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
        {/* 브랜드 */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <span className="font-serif text-lg italic text-secondary">Gwangdeok Archive</span>
          <p className="font-sans text-sm tracking-wide uppercase text-cream/60">
            광덕고등학교 조일웅 All Rights Reserved
          </p>
        </div>

        {/* 보조 링크 */}
        <div className="flex flex-wrap justify-center gap-8">
          <Link href="/magazine" className="font-sans text-sm tracking-wide uppercase text-cream/60 hover:text-secondary transition-colors">교지</Link>
          <Link href="/teacher" className="font-sans text-sm tracking-wide uppercase text-cream/60 hover:text-secondary transition-colors">교사의 서재</Link>
        </div>

        {/* 공유 & 복사 아이콘 */}
        <FooterActions />
      </div>

      <div className="border-t border-cream/10 py-6 text-center text-xs font-sans tracking-[0.2em] uppercase text-cream/30">
        © Gwangdeok High School Archival Society. All Rights Reserved.
      </div>
    </footer>
  )
}
