'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const inputClass =
  'w-full bg-white border-0 focus:ring-2 focus:ring-secondary/30 rounded-lg px-4 py-4 text-primary placeholder:text-outline font-sans text-sm'

const selectClass =
  'w-full bg-white border-0 focus:ring-2 focus:ring-secondary/30 rounded-lg px-4 py-4 text-primary font-sans text-sm appearance-none'

export default function RecoverPage() {
  // ── 아이디 찾기 상태 ────────────────────
  const [findForm, setFindForm] = useState({ name: '', grade: '', classNum: '', number: '' })
  const [findLoading, setFindLoading] = useState(false)
  const [findResult, setFindResult] = useState<string | null>(null)
  const [findError, setFindError] = useState('')

  // ── 비밀번호 재설정 상태 ─────────────────
  const [step, setStep] = useState<1 | 2>(1)
  const [verifyForm, setVerifyForm] = useState({ studentId: '', name: '', grade: '', classNum: '', number: '' })
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetDone, setResetDone] = useState(false)

  async function handleFindId(e: React.FormEvent) {
    e.preventDefault()
    setFindError('')
    setFindResult(null)
    const { name, grade, classNum, number } = findForm
    if (!name || !grade || !classNum || !number) {
      setFindError('모든 항목을 입력해주세요.'); return
    }
    setFindLoading(true)
    const res = await fetch('/api/auth/find-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, grade, classNum, number }),
    })
    const json = await res.json()
    setFindLoading(false)
    if (!res.ok) { setFindError(json.error); return }
    setFindResult(json.studentId)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setVerifyError('')
    const { studentId, name, grade, classNum, number } = verifyForm
    if (!studentId || !name || !grade || !classNum || !number) {
      setVerifyError('모든 항목을 입력해주세요.'); return
    }
    setVerifyLoading(true)
    // 본인 확인: reset-password API에서 검증하므로 여기서는 간단 validation
    // 실제 검증은 step 2 제출 시 reset-password API에서 수행
    setVerifyLoading(false)
    setStep(2)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetError('')
    const { password, confirm } = pwForm
    if (!password || password.length < 6) {
      setResetError('비밀번호는 6자 이상이어야 합니다.'); return
    }
    if (password !== confirm) {
      setResetError('비밀번호가 일치하지 않습니다.'); return
    }
    setResetLoading(true)
    const { studentId, name, grade, classNum, number } = verifyForm
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, name, grade, classNum, number, newPassword: password }),
    })
    const json = await res.json()
    setResetLoading(false)
    if (!res.ok) { setResetError(json.error); return }
    setResetDone(true)
  }

  return (
    <div className="flex-grow flex items-center justify-center p-6 md:p-12">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">

        {/* ══════════════════════════════════════════
            아이디 찾기 (왼쪽)
        ══════════════════════════════════════════ */}
        <section className="flex flex-col">
          <div className="mb-8">
            <span className="text-xs tracking-widest uppercase text-secondary mb-2 block font-bold font-sans">Account Recovery</span>
            <h1 className="font-serif text-4xl lg:text-5xl text-primary font-bold tracking-tight mb-4">아이디 찾기</h1>
            <p className="text-on-surface-variant leading-relaxed font-sans text-sm">
              가입 시 등록한 이름과 학년·반·번호를 입력해 주세요.<br />
              정보가 일치하면 등록된 학번을 안내해 드립니다.
            </p>
          </div>

          <form onSubmit={handleFindId} className="bg-surface-container-low p-8 rounded-xl space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest px-1 font-sans">성명</label>
              <input
                type="text"
                placeholder="홍길동"
                value={findForm.name}
                onChange={(e) => setFindForm({ ...findForm, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-primary uppercase tracking-widest px-1 font-sans">학년</label>
                <div className="relative">
                  <select
                    value={findForm.grade}
                    onChange={(e) => setFindForm({ ...findForm, grade: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">학년</option>
                    {[1, 2, 3].map((g) => <option key={g} value={g}>{g}학년</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[16px]">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-primary uppercase tracking-widest px-1 font-sans">반</label>
                <div className="relative">
                  <select
                    value={findForm.classNum}
                    onChange={(e) => setFindForm({ ...findForm, classNum: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">반</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
                      <option key={c} value={c}>{c}반</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[16px]">expand_more</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-primary uppercase tracking-widest px-1 font-sans">번호</label>
                <input
                  type="number"
                  placeholder="번"
                  min={1}
                  max={50}
                  value={findForm.number}
                  onChange={(e) => setFindForm({ ...findForm, number: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {findError && <p className="text-error text-xs font-sans">{findError}</p>}

            {findResult && (
              <div className="flex items-center gap-3 px-5 py-4 bg-primary-fixed rounded-lg">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 font-sans">확인된 학번</p>
                  <p className="font-serif text-2xl font-bold text-primary">{findResult}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={findLoading}
              className="w-full bg-primary text-cream py-4 rounded-lg font-bold text-base hover:bg-primary/90 transition-all flex items-center justify-center gap-2 font-sans disabled:opacity-60"
            >
              {findLoading ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <span>아이디 확인하기</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 p-4 bg-secondary-container/15 rounded-lg">
            <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">info</span>
            <p className="text-sm text-on-secondary-fixed-variant leading-snug font-sans">
              정보가 변경되었거나 조회가 되지 않는 경우,<br />
              담당 선생님께 직접 문의해 주세요.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            비밀번호 재설정 (오른쪽)
        ══════════════════════════════════════════ */}
        <section className="flex flex-col relative">
          <div className="hidden md:block absolute -left-10 top-0 bottom-0 w-px bg-outline-variant/20" />

          <div className="mb-8">
            <span className="text-xs tracking-widest uppercase text-secondary mb-2 block font-bold font-sans">Security Access</span>
            <h2 className="font-serif text-4xl lg:text-5xl text-primary font-bold tracking-tight mb-4">비밀번호 재설정</h2>
            <p className="text-on-surface-variant leading-relaxed font-sans text-sm">
              학번과 본인 정보로 인증 후<br />
              새로운 비밀번호를 설정할 수 있습니다.
            </p>
          </div>

          {resetDone ? (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-primary mb-2">비밀번호 변경 완료</h3>
                <p className="text-sm text-primary/50 font-sans">새 비밀번호로 로그인하세요.</p>
              </div>
              <Link
                href="/auth"
                className="px-6 py-2.5 rounded-full bg-primary text-cream text-sm font-bold hover:bg-primary/90 transition-colors font-sans"
              >
                로그인하러 가기
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Step 1: 본인 인증 */}
              <div className={`bg-white shadow-sm p-8 rounded-xl space-y-5 transition-opacity ${step === 2 ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-bold ${step === 1 ? 'bg-primary text-cream' : 'bg-outline-variant text-white'}`}>01</span>
                  <span className="font-sans text-sm font-bold text-primary">본인 인증</span>
                </div>
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest px-1 font-sans">학번</label>
                    <input
                      type="text"
                      placeholder="예) 30201"
                      value={verifyForm.studentId}
                      onChange={(e) => setVerifyForm({ ...verifyForm, studentId: e.target.value })}
                      className="w-full bg-surface-container-high border-0 focus:ring-2 focus:ring-secondary/30 rounded-lg px-4 py-3.5 text-primary placeholder:text-outline font-sans text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest px-1 font-sans">이름</label>
                    <input
                      type="text"
                      placeholder="홍길동"
                      value={verifyForm.name}
                      onChange={(e) => setVerifyForm({ ...verifyForm, name: e.target.value })}
                      className="w-full bg-surface-container-high border-0 focus:ring-2 focus:ring-secondary/30 rounded-lg px-4 py-3.5 text-primary placeholder:text-outline font-sans text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['grade', 'classNum', 'number'] as const).map((field, i) => (
                      <div key={field} className="space-y-2">
                        <label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest px-1 font-sans">{['학년', '반', '번호'][i]}</label>
                        {field === 'number' ? (
                          <input
                            type="number" min={1} max={50}
                            placeholder="번"
                            value={verifyForm[field]}
                            onChange={(e) => setVerifyForm({ ...verifyForm, [field]: e.target.value })}
                            className="w-full bg-surface-container-high border-0 focus:ring-2 focus:ring-secondary/30 rounded-lg px-4 py-3.5 text-primary placeholder:text-outline font-sans text-sm"
                          />
                        ) : (
                          <div className="relative">
                            <select
                              value={verifyForm[field]}
                              onChange={(e) => setVerifyForm({ ...verifyForm, [field]: e.target.value })}
                              className="w-full bg-surface-container-high border-0 focus:ring-2 focus:ring-secondary/30 rounded-lg px-4 py-3.5 text-primary font-sans text-sm appearance-none"
                            >
                              <option value="">{['학년', '반'][i]}</option>
                              {field === 'grade'
                                ? [1, 2, 3].map((g) => <option key={g} value={g}>{g}학년</option>)
                                : Array.from({ length: 10 }, (_, k) => k + 1).map((c) => <option key={c} value={c}>{c}반</option>)
                              }
                            </select>
                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[16px]">expand_more</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {verifyError && <p className="text-error text-xs font-sans">{verifyError}</p>}
                  <button
                    type="submit"
                    disabled={verifyLoading}
                    className="w-full bg-primary text-cream py-3.5 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-sans disabled:opacity-60"
                  >
                    {verifyLoading ? <Loader2 size={16} className="animate-spin" /> : '다음 단계로'}
                  </button>
                </form>
              </div>

              {/* Step 2: 새 비밀번호 */}
              <div className={`p-8 rounded-xl space-y-5 transition-all ${step === 2 ? 'bg-white shadow-sm' : 'bg-surface-container-low/50 opacity-50 pointer-events-none'}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-bold ${step === 2 ? 'bg-primary text-cream' : 'bg-outline-variant text-white'}`}>02</span>
                  <span className={`font-sans text-sm font-bold ${step === 2 ? 'text-primary' : 'text-primary/50'}`}>새 비밀번호 설정</span>
                </div>
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest px-1 font-sans">새 비밀번호</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        disabled={step !== 2}
                        value={pwForm.password}
                        onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                        className="w-full bg-surface-container-high border-0 focus:ring-2 focus:ring-secondary/30 rounded-lg px-4 py-3.5 text-primary placeholder:text-outline font-sans text-sm disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest px-1 font-sans">비밀번호 확인</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        disabled={step !== 2}
                        value={pwForm.confirm}
                        onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                        className="w-full bg-surface-container-high border-0 focus:ring-2 focus:ring-secondary/30 rounded-lg px-4 py-3.5 text-primary placeholder:text-outline font-sans text-sm disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  {resetError && <p className="text-error text-xs font-sans">{resetError}</p>}
                  <button
                    type="submit"
                    disabled={step !== 2 || resetLoading}
                    className="w-full py-3.5 rounded-lg font-bold text-base font-sans flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed bg-primary text-cream hover:bg-primary/90 disabled:opacity-50"
                  >
                    {resetLoading ? <Loader2 size={16} className="animate-spin" /> : '비밀번호 변경 완료'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
