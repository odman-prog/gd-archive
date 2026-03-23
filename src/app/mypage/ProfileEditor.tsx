'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Pencil, Check, X } from 'lucide-react'

type Props = {
  userId: string
  grade: number | null
  classNum: number | null
  number: number | null
}

export default function ProfileEditor({ userId, grade, classNum, number }: Props) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    grade: String(grade ?? ''),
    classNum: String(classNum ?? ''),
    number: String(number ?? ''),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState({ grade, classNum, number })

  async function handleSave() {
    if (!form.grade || !form.classNum || !form.number) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('profiles')
      .update({
        grade: Number(form.grade),
        class: Number(form.classNum),
        number: Number(form.number),
      })
      .eq('id', userId)
    setSaving(false)
    if (err) { setError('저장 실패: ' + err.message); return }
    setSaved({ grade: Number(form.grade), classNum: Number(form.classNum), number: Number(form.number) })
    setEditing(false)
  }

  function handleCancel() {
    setForm({ grade: String(saved.grade ?? ''), classNum: String(saved.classNum ?? ''), number: String(saved.number ?? '') })
    setError('')
    setEditing(false)
  }

  const selectClass = 'bg-surface border-0 rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

  return (
    <div className="mt-3 border-t border-primary/6 pt-3">
      {!editing ? (
        <div className="flex items-center justify-between">
          <p className="text-sm text-primary/45 font-sans">
            {saved.grade ? `${saved.grade}학년` : '—'}{' '}
            {saved.classNum ? `${saved.classNum}반` : ''}{' '}
            {saved.number ? `${saved.number}번` : ''}
          </p>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs text-primary/40 hover:text-secondary transition-colors font-sans"
          >
            <Pencil size={12} />
            학년·반·번호 수정
          </button>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary/35 mb-2 font-sans">학년 · 반 · 번호 수정</p>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className={selectClass}>
              <option value="">학년</option>
              {[1, 2, 3].map((g) => <option key={g} value={g}>{g}학년</option>)}
            </select>
            <select value={form.classNum} onChange={(e) => setForm({ ...form, classNum: e.target.value })} className={selectClass}>
              <option value="">반</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((c) => <option key={c} value={c}>{c}반</option>)}
            </select>
            <input
              type="number" min={1} max={50}
              placeholder="번호"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              className={`${selectClass} w-20`}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-cream text-xs font-sans font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              저장
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-primary/15 text-primary/50 text-xs font-sans hover:border-primary/30 transition-colors"
            >
              <X size={12} />
              취소
            </button>
          </div>
          {error && <p className="text-rose-500 text-xs mt-2 font-sans">{error}</p>}
        </div>
      )}
    </div>
  )
}
