'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

type Tab = 'login' | 'signup'

function toEmail(studentId: string) {
  return `${studentId}@gd-archive.internal`
}

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('login')

  // 로그인 폼
  const [loginForm, setLoginForm] = useState({ studentId: '', password: '' })
  // 회원가입 폼
  const [signupForm, setSignupForm] = useState({
    name: '',
    studentId: '',
    grade: '',
    classNum: '',
    number: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupDone, setSignupDone] = useState(false)

  // ── 로그인 ──────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!loginForm.studentId || !loginForm.password) {
      setError('학번과 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(loginForm.studentId),
      password: loginForm.password,
    })
    setLoading(false)

    if (error) {
      setError('학번 또는 비밀번호가 올바르지 않습니다.')
      return
    }

    router.push('/')
    router.refresh()
  }

  // ── 회원가입 ─────────────────────────────────────────
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { name, studentId, grade, classNum, number, password } = signupForm

    if (!name || !studentId || !grade || !classNum || !number || !password) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    // 서버 API Route를 통해 계정 생성 (이메일 확인 없음)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, studentId, grade, classNum, number, password }),
    })

    const result = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(result.error ?? '회원가입 중 오류가 발생했습니다.')
      return
    }

    setSignupDone(true)
  }

  // ── 렌더 ─────────────────────────────────────────────
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden border border-[#1B4332]/10">

        {/* 탭 */}
        <div className="flex">
          {(['login', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'bg-[#1B4332] text-[#FEFAE0]'
                  : 'bg-[#FEFAE0] text-[#1B4332]/50 hover:text-[#1B4332]'
              }`}
            >
              {t === 'login' ? '로그인' : '가입 신청'}
            </button>
          ))}
        </div>

        <div className="px-8 py-8">
          {/* 로고 */}
          <div className="text-center mb-8">
            <span className="text-3xl">📚</span>
            <h1 className="mt-2 text-xl font-bold text-[#1B4332]">광덕아카이브</h1>
          </div>

          {/* ── 로그인 폼 ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1B4332] mb-1">학번</label>
                <input
                  type="text"
                  placeholder="예) 30201"
                  value={loginForm.studentId}
                  onChange={(e) => setLoginForm({ ...loginForm, studentId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#1B4332]/20 bg-[#FEFAE0] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B4332] mb-1">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호 입력"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#1B4332]/20 bg-[#FEFAE0] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B4332]/40"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 rounded-lg bg-[#1B4332] text-[#FEFAE0] font-semibold text-sm hover:bg-[#163728] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                로그인
              </button>
            </form>
          )}

          {/* ── 회원가입 폼 ── */}
          {tab === 'signup' && !signupDone && (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1B4332] mb-1">이름</label>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#1B4332]/20 bg-[#FEFAE0] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B4332] mb-1">학번</label>
                <input
                  type="text"
                  placeholder="예) 30201"
                  value={signupForm.studentId}
                  onChange={(e) => setSignupForm({ ...signupForm, studentId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#1B4332]/20 bg-[#FEFAE0] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1B4332] mb-1">학년</label>
                  <select
                    value={signupForm.grade}
                    onChange={(e) => setSignupForm({ ...signupForm, grade: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#1B4332]/20 bg-[#FEFAE0] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 text-sm"
                  >
                    <option value="">학년</option>
                    {[1, 2, 3].map((g) => <option key={g} value={g}>{g}학년</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B4332] mb-1">반</label>
                  <select
                    value={signupForm.classNum}
                    onChange={(e) => setSignupForm({ ...signupForm, classNum: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#1B4332]/20 bg-[#FEFAE0] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 text-sm"
                  >
                    <option value="">반</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
                      <option key={c} value={c}>{c}반</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B4332] mb-1">번호</label>
                  <input
                    type="number"
                    placeholder="번호"
                    min={1}
                    max={50}
                    value={signupForm.number}
                    onChange={(e) => setSignupForm({ ...signupForm, number: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#1B4332]/20 bg-[#FEFAE0] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B4332] mb-1">비밀번호 <span className="text-[#1B4332]/40 font-normal">(6자 이상)</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호 입력"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#1B4332]/20 bg-[#FEFAE0] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B4332]/40"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 rounded-lg bg-[#1B4332] text-[#FEFAE0] font-semibold text-sm hover:bg-[#163728] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                가입 신청
              </button>
            </form>
          )}

          {/* ── 가입 완료 메시지 ── */}
          {tab === 'signup' && signupDone && (
            <div className="text-center py-4 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#D4A373]/20 flex items-center justify-center text-3xl">
                ✅
              </div>
              <h2 className="text-lg font-bold text-[#1B4332]">가입 신청 완료</h2>
              <p className="text-sm text-[#1B4332]/60 leading-relaxed">
                담당 선생님 승인 후 이용 가능합니다.<br />
                승인은 영업일 기준 1~2일 소요될 수 있습니다.
              </p>
              <button
                onClick={() => { setTab('login'); setSignupDone(false) }}
                className="mt-2 px-6 py-2.5 rounded-lg border border-[#D4A373] text-[#D4A373] text-sm font-medium hover:bg-[#D4A373] hover:text-[#1B4332] transition-colors"
              >
                로그인으로 돌아가기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
