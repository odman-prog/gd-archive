import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-primary/10">
      <div className="max-w-screen-2xl mx-auto px-8 py-16 flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-md">
          <h3 className="font-serif text-lg text-primary mb-4">광덕아카이브</h3>
          <p className="text-primary/60 text-sm leading-relaxed mb-6 font-sans">
            광덕고등학교 학생들의 학문적 깊이와 창의적 표현을 담은<br />
            디지털 교지 아카이브입니다.
          </p>
          <p className="text-primary font-bold font-serif text-base">
            광덕고등학교 국어과<br />
            <span className="text-secondary italic font-normal">교지편집부</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-16 gap-y-4">
          <div className="flex flex-col gap-3">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">탐색</p>
            <Link href="/archive" className="text-primary/60 hover:text-secondary text-sm transition-colors font-sans">아카이브</Link>
            <Link href="/write" className="text-primary/60 hover:text-secondary text-sm transition-colors font-sans">글 올리기</Link>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">계정</p>
            <Link href="/auth" className="text-primary/60 hover:text-secondary text-sm transition-colors font-sans">로그인</Link>
            <Link href="/mypage" className="text-primary/60 hover:text-secondary text-sm transition-colors font-sans">내 정보</Link>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-8 py-6 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-primary/40 font-sans">© 광덕고등학교 국어과 교지편집부. All Rights Reserved.</p>
        <div className="flex gap-6">
          <span className="material-symbols-outlined text-primary/30 text-lg cursor-pointer hover:text-secondary transition-colors">share</span>
          <span className="material-symbols-outlined text-primary/30 text-lg cursor-pointer hover:text-secondary transition-colors">mail</span>
          <span className="material-symbols-outlined text-primary/30 text-lg cursor-pointer hover:text-secondary transition-colors">print</span>
        </div>
      </div>
    </footer>
  )
}
