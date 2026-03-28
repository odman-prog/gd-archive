'use client'

import { useState } from 'react'
import { Loader2, KeyRound, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inputClass =
  'w-full bg-surface-container-low border-0 focus:ring-2 focus:ring-secondary/30 rounded-lg px-4 py-3 text-primary placeholder:text-outline font-sans text-sm'

export default function ChangePasswordForm() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.current) { setError('현재 비밀번호를 입력해주세요.'); return }
    if (form.next.length < 6) { setError('새 비밀번호는 6자 이상이어야 합니다.'); return }
    if (form.next !== form.confirm) { setError('새 비밀번호가 일치하지 않습니다.'); return }

    setLoading(true)
    try {
      const supabase = createClient()

      // 현재 로그인된 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) { setError('로그인 정보를 찾을 수 없습니다.'); return }

      // 현재 비밀번호 검증 (재인증)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: form.current,
      })
      if (signInError) { setError('현재 비밀번호가 올바르지 않습니다.'); return }

      // 새 비밀번호로 변경
      const { error: updateError } = await supabase.auth.updateUser({ password: form.next })
      if (updateError) { setError('비밀번호 변경에 실패했습니다: ' + updateError.message); return }

      setDone(true)
      setForm({ current: '', next: '', confirm: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-primary/8 p-6 mb-8">
      <button
        onClick={() => { setOpen((v) => !v); setDone(false); setError('') }}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/8 flex items-center justify-center">
            <KeyRound size={15} className="text-primary/60" />
          </div>
          <span className="text-sm font-semibold text-primary font-sans">비밀번호 변경</span>
        </div>
        {open ? <ChevronUp size={16} className="text-primary/40" /> : <ChevronDown size={16} className="text-primary/40" />}
      </button>

      {open && (
        <div className="mt-5 pt-5 border-t border-primary/8">
          {done ? (
            <div className="flex items-center gap-3 py-4 px-4 bg-emerald-50 rounded-xl">
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
              <p className="text-sm font-medium text-emerald-700 font-sans">비밀번호가 성공적으로 변경되었습니다.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-primary/50 uppercase tracking-widest px-1 font-sans">현재 비밀번호</label>
                <input
                  type="password"
                  placeholder="현재 비밀번호 입력"
                  value={form.current}
                  onChange={(e) => setForm({ ...form, current: e.target.value })}
                  className={inputClass}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-primary/50 uppercase tracking-widest px-1 font-sans">새 비밀번호</label>
                <input
                  type="password"
                  placeholder="새 비밀번호 (6자 이상)"
                  value={form.next}
                  onChange={(e) => setForm({ ...form, next: e.target.value })}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-primary/50 uppercase tracking-widest px-1 font-sans">새 비밀번호 확인</label>
                <input
                  type="password"
                  placeholder="새 비밀번호 재입력"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="text-xs text-rose-500 font-sans">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-cream text-sm font-bold font-sans hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : '비밀번호 변경'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
