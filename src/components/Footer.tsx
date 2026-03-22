import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-primary text-cream">
      <div className="max-w-screen-2xl mx-auto px-8 md:px-12 pt-16 pb-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
        {/* 브랜드 */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <span className="font-serif text-lg italic text-secondary">Gwangdeok Archive</span>
          <p className="font-sans text-sm tracking-wide uppercase text-cream/60">
            광덕고등학교 국어과 교지편집부
          </p>
        </div>

        {/* 링크 */}
        <div className="flex flex-wrap justify-center gap-8">
          <Link href="/archive" className="font-sans text-sm tracking-wide uppercase text-cream/60 hover:text-secondary transition-colors">아카이브</Link>
          <Link href="/write" className="font-sans text-sm tracking-wide uppercase text-cream/60 hover:text-secondary transition-colors">글 올리기</Link>
          <Link href="/auth" className="font-sans text-sm tracking-wide uppercase text-cream/60 hover:text-secondary transition-colors">로그인</Link>
          <Link href="/mypage" className="font-sans text-sm tracking-wide uppercase text-cream/60 hover:text-secondary transition-colors">마이페이지</Link>
        </div>

        {/* 소셜 아이콘 */}
        <div className="flex gap-6">
          <span className="material-symbols-outlined text-cream/40 hover:text-secondary cursor-pointer transition-colors">share</span>
          <span className="material-symbols-outlined text-cream/40 hover:text-secondary cursor-pointer transition-colors">library_books</span>
        </div>
      </div>

      <div className="border-t border-cream/10 py-6 text-center text-xs font-sans tracking-[0.2em] uppercase text-cream/30">
        © Gwangdeok High School Archival Society. All Rights Reserved.
      </div>
    </footer>
  )
}
