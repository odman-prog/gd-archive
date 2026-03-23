'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DeleteAccountButton() {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/user/delete-account', { method: 'POST' })
    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? '오류가 발생했습니다.')
      setLoading(false)
      return
    }
    // 로그아웃 후 홈으로
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-xs text-primary/30 hover:text-error transition-colors font-sans underline underline-offset-2"
      >
        회원탈퇴
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-error/80 font-sans">
        정말 탈퇴하시겠습니까? 모든 데이터가 <strong>영구 삭제</strong>됩니다.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error text-white text-xs font-bold font-sans hover:bg-error/90 transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          탈퇴 확인
        </button>
        <button
          onClick={() => { setConfirm(false); setError('') }}
          className="px-3 py-1.5 rounded-lg border border-primary/15 text-primary/50 text-xs font-sans hover:border-primary/30 transition-colors"
        >
          취소
        </button>
      </div>
      {error && <p className="text-xs text-error font-sans">{error}</p>}
    </div>
  )
}
