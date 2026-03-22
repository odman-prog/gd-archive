import Link from 'next/link'

export default function TeacherPage() {
  return (
    <div className="bg-surface">

      {/* ── 히어로 ───────────────────────────────── */}
      <section className="relative min-h-[716px] flex items-center pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-archive.png"
            alt=""
            className="w-full h-full object-cover brightness-[0.85] contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/20 to-surface" />
        </div>
        <div className="relative z-10 max-w-screen-2xl mx-auto px-8 w-full">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest uppercase rounded-full mb-6 font-sans">
              교사진 공유 큐레이션
            </span>
            <h1 className="font-serif text-6xl md:text-8xl text-primary leading-[0.9] tracking-tighter mb-8">
              교사의<br /><span className="italic">서재</span>
            </h1>
            <div className="h-1 w-24 bg-secondary mb-8" />
            <p className="font-sans text-xl md:text-2xl text-on-surface leading-relaxed max-w-lg">
              Gwangdeok faculty shares the wisdom and philosophical texts that define our academic spirit.
            </p>
          </div>
        </div>
      </section>

      {/* ── 인트로 ───────────────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-8 py-24">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          <div className="md:w-1/3">
            <h2 className="font-serif text-3xl text-primary leading-tight">
              서재의 의미:<br />지혜의 공명
            </h2>
          </div>
          <div className="md:w-2/3 border-l border-outline-variant/30 pl-12">
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed mb-6">
              이곳은 단순한 도서 목록을 넘어, 우리 교육 공동체가 지향하는 가치와 철학이 담긴 지적 거점입니다.
              국어과 교사진이 엄선한 텍스트들은 교실 안의 지식을 넘어 삶을 관통하는 통찰을 제안합니다.
            </p>
            <p className="font-sans text-lg text-on-surface-variant leading-relaxed">
              우리는 문장을 통해 대화하고, 페이지 사이에서 새로운 교육적 영감을 발견합니다.
              광덕의 교사들이 사랑하고 아끼는 문장들이 학생들의 성장에 소중한 밑거름이 되기를 바랍니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 큐레이션 벤토 그리드 ─────────────────── */}
      <section className="bg-surface-container-low py-32">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="font-sans text-secondary text-sm font-bold tracking-widest block mb-2 uppercase">Curated Collection</span>
              <h3 className="font-serif text-4xl text-primary">이달의 큐레이션</h3>
            </div>
            <Link href="/archive" className="font-sans text-primary hover:text-secondary transition-colors flex items-center gap-2 group text-sm font-bold">
              전체 보기
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* 피처드 카드 (8/12) */}
            <div className="md:col-span-8 group cursor-pointer">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 h-full">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-1/2 aspect-[4/3] md:aspect-auto overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/hero-document.png"
                      alt="교사의 서재 피처드"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="md:w-1/2 p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex gap-2 mb-4">
                        <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold tracking-widest rounded-full uppercase font-sans">
                          Philosophy
                        </span>
                      </div>
                      <h4 className="font-serif text-3xl text-primary mb-4 leading-tight">
                        존재와 시간의 대화:<br />인문학적 통찰
                      </h4>
                      <p className="font-sans text-on-surface-variant text-sm line-clamp-3 mb-6 leading-relaxed">
                        시간의 흐름 속에서 우리가 잊지 말아야 할 가치들에 대하여 논합니다.
                        교실 밖에서도 유효한 지혜의 정수를 담았습니다.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] text-cream font-bold font-sans">
                        조일
                      </div>
                      <span className="font-sans text-xs text-primary font-bold">조일웅 선생님 추천</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 세컨더리 카드 (4/12) */}
            <div className="md:col-span-4 group cursor-pointer">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 h-full flex flex-col">
                <div className="aspect-[4/3] relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/hero-logo.png"
                    alt="교사 추천"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold tracking-widest rounded-full uppercase italic font-sans">
                      Featured
                    </span>
                  </div>
                </div>
                <div className="p-8 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif text-2xl text-primary mb-4 leading-tight">언어의 온도와 질감</h4>
                    <p className="font-sans text-on-surface-variant text-sm line-clamp-2 leading-relaxed">
                      우리가 사용하는 언어가 타인의 마음에 닿는 방식에 대한 탐구입니다.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="font-sans text-[10px] text-on-surface-variant font-medium uppercase tracking-widest">Literature</span>
                    <span
                      className="material-symbols-outlined text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >auto_stories</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 텍스트 카드 (5/12) */}
            <div className="md:col-span-5 group cursor-pointer">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 h-full">
                <div className="p-10 h-full flex flex-col justify-between">
                  <div>
                    <span className="font-sans text-[10px] text-secondary font-bold tracking-[0.2em] uppercase mb-6 block">
                      Legacy Collection
                    </span>
                    <h4 className="font-serif text-2xl text-primary mb-4 leading-tight">
                      광덕의 정신을 잇는<br />필독서 10선
                    </h4>
                    <p className="font-sans text-on-surface-variant text-sm mb-8 leading-relaxed">
                      개교 이래 교사들이 아껴온 텍스트들을 하나의 리스트로 정리했습니다.
                      세대를 넘어 공유되는 가치의 원천입니다.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-bold text-xs font-sans">
                    리스트 보기
                    <span className="material-symbols-outlined text-[16px]">bookmark</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA 카드 (7/12) */}
            <div className="md:col-span-7 relative overflow-hidden rounded-2xl group cursor-pointer min-h-[320px]">
              <div className="absolute inset-0 bg-primary-container">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#fed488,_transparent_70%)]" />
              </div>
              <div className="absolute inset-0 p-12 flex flex-col justify-center items-center text-center">
                <h4 className="font-serif text-4xl text-cream mb-6 leading-snug">
                  여러분의 서재에는<br />어떤 문장이 남아있나요?
                </h4>
                <p className="font-sans text-on-primary-container max-w-md mb-8 text-sm leading-relaxed">
                  교사들이 추천한 책을 읽고 남긴 여러분의 감상을 공유해주세요.
                  훌륭한 리뷰는 아카이브에 영구히 기록됩니다.
                </p>
                <Link
                  href="/write"
                  className="bg-secondary px-8 py-3 rounded-full text-cream font-sans font-bold text-sm tracking-widest hover:bg-secondary/90 transition-colors"
                >
                  참여하기
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 시그니처 인용구 ──────────────────────── */}
      <section className="py-32 bg-surface">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <span
            className="material-symbols-outlined text-[60px] text-secondary/30 mb-8 block"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >format_quote</span>
          <blockquote className="font-serif text-3xl md:text-4xl text-primary italic leading-snug mb-10">
            &ldquo;교육은 양동이를 채우는 것이 아니라,<br />불을 지피는 것이다.&rdquo;
          </blockquote>
          <cite className="font-sans text-sm text-on-surface-variant not-italic tracking-[0.2em]">— W.B. Yeats</cite>
        </div>
      </section>

    </div>
  )
}
