import Link from 'next/link'

const BOOKS = [
  {
    title: '침묵의 봄',
    author: 'Rachel Carson',
    category: '고전',
    desc: '과학적 사실과 문학적 감수성이 결합된 고전. 환경의 소중함을 다시금 일깨우는 필독서입니다.',
  },
  {
    title: '데미안',
    author: 'Hermann Hesse',
    category: '소설',
    desc: '자아를 찾아 떠나는 청춘의 고뇌와 성장을 담은 영원한 스테디셀러.',
  },
  {
    title: '그리스인 조르바',
    author: 'Nikos Kazantzakis',
    category: '철학',
    desc: '자유로운 영혼의 외침, 진정한 삶의 가치를 묻는 철학적 서사시.',
  },
  {
    title: '채근담',
    author: '홍자성',
    category: '동양고전',
    desc: '인생의 지혜와 처세를 담은 명언 모음. 자기 수양의 교과서.',
  },
]

export default function TeacherPage() {
  return (
    <div className="bg-surface">

      {/* ── 히어로 ───────────────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-8 md:px-12 pt-16 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-sans text-xs tracking-[0.2em] uppercase text-secondary font-bold mb-4 block">
              Faculty Curations
            </span>
            <h1 className="font-serif text-6xl md:text-8xl text-primary font-bold leading-[0.9] tracking-tighter mb-8 italic">
              교사의<br />서재
            </h1>
            <p className="font-sans text-lg text-on-surface-variant max-w-lg leading-relaxed">
              광덕고등학교 국어과 조일웅 교사가 엄선한 도서와 사유의 공간입니다.
              지성을 깊게 하는 텍스트와의 만남을 제안합니다.
            </p>
          </div>

          {/* 우측 이미지 (기울어진 배경 효과) */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-surface-container-low rounded-2xl -rotate-2 z-0" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-document.png"
              alt="교사의 서재"
              className="relative z-10 w-full aspect-[4/5] object-cover rounded-xl shadow-lg group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* ── 이달의 추천 (피처드) ─────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-8 md:px-12 mb-24">
        <div className="grid md:grid-cols-12 gap-0 items-stretch bg-surface-container-low rounded-2xl overflow-hidden shadow-sm">
          {/* 텍스트 */}
          <div className="md:col-span-7 p-12 md:p-20 flex flex-col justify-center">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-8 bg-secondary" />
              <span className="font-sans text-xs text-secondary tracking-widest uppercase font-bold">
                Essence of Literature
              </span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-primary font-bold mb-6 leading-tight">
              조일웅 교사의 사유:<br />고전에서 발견하는<br />현대적 가치
            </h2>
            <p className="font-sans text-lg text-on-surface-variant mb-10 leading-relaxed">
              <span className="float-left font-serif font-bold text-primary mr-2 leading-none" style={{ fontSize: '4rem', lineHeight: 0.8 }}>우</span>
              리는 매일 수많은 활자 속에 살아가지만, 정작 영혼을 울리는 문장을 만나기란 쉽지 않습니다.
              국어과 조일웅 교사가 추천하는 이달의 도서들은 시대를 관통하는 지혜와 인간의 본질에 대한
              깊은 성찰을 담고 있습니다. 텍스트 너머의 진실을 마주하는 시간을 제안합니다.
            </p>
            <Link
              href="/archive"
              className="font-sans text-sm font-bold text-primary group flex items-center gap-2 uppercase tracking-widest"
            >
              아카이브 탐색하기
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          {/* 우측 풀블리드 이미지 */}
          <div className="md:col-span-5 relative min-h-[400px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-archive.png"
              alt="교사의 서재"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── 추천 도서 ────────────────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-8 md:px-12 mb-24">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-secondary font-sans text-xs tracking-[0.3em] uppercase mb-2 block">Curated Bookshelf</span>
            <h3 className="font-serif text-3xl text-primary font-bold">추천 도서</h3>
            <p className="font-sans text-on-surface-variant mt-1">지성을 깊게 하는 선별된 독서 목록</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 첫 번째 카드 - 와이드 */}
          <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm hover:-translate-y-1 transition-all border border-primary/5">
            <div className="flex gap-6">
              <div className="w-1/3 aspect-[2/3] rounded-xl overflow-hidden shadow-md flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hero-logo.png" alt={BOOKS[0].title} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-full mb-3 w-fit uppercase tracking-wider font-sans">
                  {BOOKS[0].category}
                </span>
                <h4 className="font-serif text-2xl font-bold text-primary mb-1 italic leading-tight">{BOOKS[0].title}</h4>
                <p className="font-sans text-xs text-secondary mb-3 uppercase tracking-wide">{BOOKS[0].author}</p>
                <p className="font-sans text-sm text-on-surface-variant line-clamp-3 leading-relaxed">{BOOKS[0].desc}</p>
              </div>
            </div>
          </div>

          {/* 나머지 카드들 */}
          {BOOKS.slice(1).map((book) => (
            <div key={book.title} className="bg-surface-container-high p-8 rounded-2xl flex flex-col items-center text-center hover:-translate-y-1 transition-all">
              <div className="w-20 h-32 rounded-lg overflow-hidden shadow-md mb-6 -mt-12 transform rotate-3 border border-primary/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hero-logo.png" alt={book.title} className="w-full h-full object-cover opacity-70" />
              </div>
              <span className="inline-block px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[9px] font-bold rounded-full mb-3 uppercase tracking-wider font-sans">
                {book.category}
              </span>
              <h4 className="font-serif text-xl font-bold text-primary mb-1 italic">{book.title}</h4>
              <p className="font-sans text-[10px] text-secondary mb-3 uppercase tracking-widest">{book.author}</p>
              <p className="font-sans text-xs text-on-surface-variant leading-relaxed line-clamp-3">{book.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 인용구 ──────────────────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-8 md:px-12 mb-24">
        <div className="py-20 bg-primary text-cream rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none select-none flex items-center justify-end pr-8">
            <span className="material-symbols-outlined" style={{ fontSize: '18rem', lineHeight: 1 }}>format_quote</span>
          </div>
          <div className="relative z-10 px-12 md:px-24 text-center max-w-4xl mx-auto">
            <span
              className="material-symbols-outlined text-secondary text-[48px] mb-8 block"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >auto_stories</span>
            <blockquote className="font-serif text-3xl md:text-4xl italic leading-snug mb-8">
              &ldquo;교육은 양동이를 채우는 것이 아니라 불을 지피는 것이다.&rdquo;
            </blockquote>
            <cite className="font-sans text-sm uppercase tracking-widest text-cream/50 not-italic">
              William Butler Yeats · Archive Motto
            </cite>
          </div>
        </div>
      </section>

      {/* ── 아카이브 기여 CTA ───────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-8 md:px-12 mb-24">
        <div className="relative rounded-2xl overflow-hidden group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-archive.png"
            alt=""
            className="w-full h-64 md:h-80 object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-transparent p-12 flex flex-col justify-end">
            <h3 className="font-serif text-2xl text-cream font-bold mb-2 italic">아카이브에 기여하세요</h3>
            <p className="text-cream/70 font-sans text-sm mb-6 max-w-md">
              광덕고등학교 학생이라면 누구나 자신의 글과 사유를 아카이브에 남길 수 있습니다.
            </p>
            <Link
              href="/write"
              className="inline-flex items-center gap-2 px-6 py-3 bg-cream text-primary rounded-full text-sm font-bold hover:bg-secondary-container transition-colors w-fit font-sans"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              글 올리기
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
