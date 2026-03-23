import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import WriteForm from './WriteForm'

export default async function WritePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── 비로그인 안내 화면 ────────────────────────────
  if (!user) {
    return (
      <div className="bg-surface min-h-screen">
        <div className="relative h-[52vh] min-h-[340px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/a.png" alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-primary/55 to-primary/90" />
          <div className="absolute inset-0 flex flex-col justify-end max-w-screen-xl mx-auto px-6 md:px-16 pb-16 md:pb-20">
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream/35 mb-4 block">
              Gwangdeok Archive · New Entry
            </span>
            <h1 className="font-serif text-6xl md:text-[8rem] text-cream italic leading-[0.85] tracking-tighter">
              기록
            </h1>
          </div>
        </div>

        <div className="relative -mt-10 max-w-md mx-auto px-5 pb-24">
          <div className="bg-white rounded-3xl shadow-2xl shadow-primary/15 px-8 md:px-10 py-10 md:py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/6 border border-primary/8 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-primary/40 text-[26px]">lock</span>
            </div>
            <h2 className="font-serif text-2xl text-primary mb-2">로그인이 필요합니다</h2>
            <p className="font-sans text-sm text-primary/45 leading-relaxed mb-8">
              글을 작성하려면 먼저 로그인해주세요.<br />
              계정이 없다면 회원가입 후 이용할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/auth"
                className="flex-1 py-3 rounded-2xl bg-primary text-cream text-sm font-sans font-semibold text-center hover:bg-primary/90 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/archive"
                className="flex-1 py-3 rounded-2xl border border-primary/12 text-primary/55 text-sm font-sans text-center hover:border-primary/25 hover:text-primary/70 transition-colors"
              >
                아카이브 보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('status, name')
    .eq('id', user.id)
    .single()

  // ── 비활성 안내 화면 ─────────────────────────────
  if (profile?.status === 'inactive') {
    return (
      <div className="bg-surface min-h-screen">
        <div className="relative h-[52vh] min-h-[340px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/a.png" alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-primary/55 to-primary/90" />
          <div className="absolute inset-0 flex flex-col justify-end max-w-screen-xl mx-auto px-6 md:px-16 pb-16 md:pb-20">
            <h1 className="font-serif text-6xl md:text-[8rem] text-cream italic leading-[0.85] tracking-tighter">기록</h1>
          </div>
        </div>
        <div className="relative -mt-10 max-w-md mx-auto px-5 pb-24">
          <div className="bg-white rounded-3xl shadow-2xl shadow-primary/15 px-8 md:px-10 py-10 md:py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/6 border border-primary/10 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-primary/40 text-[26px]">block</span>
            </div>
            <h2 className="font-serif text-2xl text-primary mb-2">비활성 계정</h2>
            <p className="font-sans text-sm text-primary/45 leading-relaxed mb-6">
              {profile?.name ? `${profile.name}님의 ` : ''}계정이 비활성화되어<br />글 작성이 제한됩니다.<br />담당 선생님에게 문의해주세요.
            </p>
            <Link href="/archive" className="inline-block px-6 py-2.5 rounded-full border border-primary/15 text-sm text-primary/60 font-sans hover:bg-surface transition-colors">
              아카이브 보기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── 승인 대기 안내 화면 ──────────────────────────
  if (!profile || profile.status !== 'approved') {
    return (
      <div className="bg-surface min-h-screen">
        <div className="relative h-[52vh] min-h-[340px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/a.png" alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/50 via-primary/55 to-primary/90" />
          <div className="absolute inset-0 flex flex-col justify-end max-w-screen-xl mx-auto px-6 md:px-16 pb-16 md:pb-20">
            <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-cream/35 mb-4 block">
              Gwangdeok Archive · New Entry
            </span>
            <h1 className="font-serif text-6xl md:text-[8rem] text-cream italic leading-[0.85] tracking-tighter">
              기록
            </h1>
          </div>
        </div>

        <div className="relative -mt-10 max-w-md mx-auto px-5 pb-24">
          <div className="bg-white rounded-3xl shadow-2xl shadow-primary/15 px-8 md:px-10 py-10 md:py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-secondary/12 border border-secondary/15 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-secondary text-[26px]">schedule</span>
            </div>
            <h2 className="font-serif text-2xl text-primary mb-2">승인 대기 중</h2>
            <p className="font-sans text-sm text-primary/45 leading-relaxed mb-6">
              {profile?.name ? `${profile.name}님, ` : ''}담당 선생님의 승인 후<br />글을 올릴 수 있습니다.
            </p>
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/5 text-xs text-primary/40 font-sans">
              현재 상태: <span className="font-semibold text-secondary">검토 중</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 메인 기록하기 페이지 ─────────────────────────
  return (
    <div className="bg-surface min-h-screen">

      {/* 히어로 */}
      <div className="relative h-[50vh] min-h-[360px] md:h-[58vh] md:min-h-[420px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/a.png"
          alt=""
          className="w-full h-full object-cover object-center scale-105"
          style={{ objectPosition: '50% 40%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/45 via-primary/50 to-primary/88" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end max-w-screen-xl mx-auto px-6 md:px-16 pb-16 md:pb-20">
          <span className="font-sans text-[10px] tracking-[0.35em] uppercase text-cream/35 mb-4 md:mb-5 block">
            Gwangdeok Archive · New Entry
          </span>
          <h1 className="font-serif text-7xl md:text-[10rem] text-cream italic leading-[0.82] tracking-tighter mb-5 md:mb-6">
            기록
          </h1>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="h-px w-10 md:w-12 bg-secondary" />
            <p className="font-sans text-[11px] md:text-xs text-cream/40 tracking-wide">
              당신의 문장이 광덕의 지성사에 한 페이지를 더합니다
            </p>
          </div>
        </div>
      </div>

      {/* 폼 카드 */}
      <div className="relative -mt-12 md:-mt-16 max-w-3xl mx-auto px-4 md:px-6 pb-20 md:pb-28">
        <div className="bg-white rounded-3xl shadow-2xl shadow-primary/12 overflow-hidden">

          {/* 카드 헤더 */}
          <div className="px-6 md:px-14 pt-8 md:pt-12 pb-6 md:pb-8 border-b border-primary/6">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-secondary block mb-2">
                  New Entry
                </span>
                <h2 className="font-serif text-2xl md:text-3xl text-primary">기록하기</h2>
              </div>
              <div className="hidden md:flex w-10 h-10 rounded-full bg-primary/5 items-center justify-center">
                <span className="material-symbols-outlined text-primary/30 text-[20px]">edit_note</span>
              </div>
            </div>
            <p className="font-sans text-xs text-primary/35 mt-2.5 leading-relaxed">
              작성한 글은 편집부 검토 후 아카이브에 게시됩니다.
            </p>
          </div>

          {/* 폼 본체 */}
          <div className="px-6 md:px-14 py-8 md:py-12">
            <WriteForm userId={user.id} />
          </div>

        </div>
      </div>
    </div>
  )
}
