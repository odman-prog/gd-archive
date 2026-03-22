'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

  const [loginForm, setLoginForm] = useState({ studentId: '', password: '' })
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

  const inputClass = 'w-full bg-surface border-0 rounded-lg px-5 py-3.5 text-sm text-primary placeholder:text-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20'

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-stretch">
      <div className="hidden md:flex md:w-5/12 bg-primary flex-col justify-end p-14 relative">
        <div>
          <span className="inline-block px-3 py-1 bg-secondary text-cream text-[10px] font-bold rounded-full mb-8 uppercase tracking-widest">
            Established
          </span>
          <h2 className="text-5xl font-serif leading-tight text-cream mb-5">
            기록으로<br />피어나는<br />지성
          </h2>
          <p className="text-cream/50 text-sm leading-relaxed">
            광덕고등학교의 모든 창작물과 학술적 성취를 담아내는 디지털 프레스 아카이브에 오신 것을 환영합니다.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-16 bg-cream">
        <div className="w-full max-w-sm">
          {/* 탭 */}
          <div className="flex gap-8 mb-10 border-b border-primary/10">
            {(['login', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`pb-4 text-lg font-serif font-bold border-b-2 transition-all -mb-px ${
                  tab === t
                    ? 'border-primary text-primary'
                    : 'border-transparent text-primary/30 hover:text-primary/60'
                }`}
              >
                {t === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          {/* ── 로그인 폼 ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">학번 (Student ID)</label>
                <input
                  type="text"
                  placeholder="예) 30201"
                  value={loginForm.studentId}
                  onChange={(e) => setLoginForm({ ...loginForm, studentId: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">비밀번호 (Password)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary/60"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-rose-500 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-[#1a4432] text-cream py-4 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                아카이브 입장하기
              </button>
              <p className="text-center text-xs text-primary/30">
                학번이나 비밀번호를 잊으셨나요?{' '}
                <Link href="/auth/recover" className="text-secondary hover:underline font-medium">
                  계정 정보 찾기
                </Link>
              </p>
            </form>
          )}

          {/* ── 회원가입 폼 ── */}
          {tab === 'signup' && !signupDone && (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">이름</label>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">학번</label>
                <input
                  type="text"
                  placeholder="예) 30201"
                  value={signupForm.studentId}
                  onChange={(e) => setSignupForm({ ...signupForm, studentId: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">학년</label>
                  <select
                    value={signupForm.grade}
                    onChange={(e) => setSignupForm({ ...signupForm, grade: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">학년</option>
                    {[1, 2, 3].map((g) => <option key={g} value={g}>{g}학년</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">반</label>
                  <select
                    value={signupForm.classNum}
                    onChange={(e) => setSignupForm({ ...signupForm, classNum: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">반</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => (
                      <option key={c} value={c}>{c}반</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">번호</label>
                  <input
                    type="number"
                    placeholder="번"
                    min={1}
                    max={50}
                    value={signupForm.number}
                    onChange={(e) => setSignupForm({ ...signupForm, number: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">비밀번호 <span className="normal-case font-normal">(6자 이상)</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary/60"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-rose-500 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-[#1a4432] text-cream py-4 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                가입 신청
              </button>
            </form>
          )}

          {/* ── 가입 완료 메시지 ── */}
          {tab === 'signup' && signupDone && (
            <div className="text-center py-8 flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-primary mb-2">가입 신청 완료</h2>
                <p className="text-sm text-primary/50 leading-relaxed">
                  담당 선생님 승인 후 이용 가능합니다.<br />
                  승인은 영업일 기준 1~2일 소요될 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => { setTab('login'); setSignupDone(false) }}
                className="px-6 py-2.5 rounded-full border border-primary/20 text-primary text-sm font-medium hover:bg-surface transition-colors"
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
