'use client'

import { useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, BookOpen, Plus, Upload, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

type Magazine = {
  id: string
  title: string
  issue_number: number
  theme: string | null
  publish_date: string | null
  cover_url: string | null
  pdf_url: string | null
  created_at: string
}

type Profile = {
  id: string
  name: string
  student_id: string
  grade: number
  class: number
  number: number
  role: string
  status: string
  created_at: string
}

type Stats = {
  total: number
  active: number
  monthlyUploads: number
}

const ROLE_OPTIONS = [
  { value: 'student',      label: '학생' },
  { value: 'editor',       label: '편집부원' },
  { value: 'chief_editor', label: '편집장' },
]

const ROLE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  student:      { label: '학생',    bg: 'bg-surface-container-high', text: 'text-on-surface-variant' },
  editor:       { label: '편집부원', bg: 'bg-primary-fixed',          text: 'text-primary' },
  chief_editor: { label: '편집장',  bg: 'bg-secondary-container',     text: 'text-on-secondary-container' },
  teacher:      { label: '교사',    bg: 'bg-secondary-container',     text: 'text-on-secondary-container' },
}

const STATUS_LABELS: Record<string, { label: string; bg: string; dot: string }> = {
  pending:  { label: '대기',   bg: 'bg-[#ffdea5]/50',       dot: 'bg-secondary' },
  approved: { label: '활성',   bg: 'bg-primary-fixed',      dot: 'bg-primary' },
  rejected: { label: '거부',   bg: 'bg-error-container/40', dot: 'bg-error' },
  inactive: { label: '비활성', bg: 'bg-surface-container',  dot: 'bg-primary/25' },
}

const supabase = createClient()

export default function AdminClient({
  teacherName,
  currentUserId,
  isSuperAdmin,
  initialPending,
  initialUsers,
  initialStats,
}: {
  teacherName: string
  currentUserId: string
  isSuperAdmin: boolean
  initialPending: Profile[]
  initialUsers: Profile[]
  initialStats: Stats
}) {
  const [tab, setTab] = useState<'members' | 'magazine'>('members')

  const [pending, setPending] = useState(initialPending)
  const [users, setUsers] = useState(initialUsers)
  const [stats, setStats] = useState(initialStats)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [classTabs, setClassTabs] = useState<Record<string, number | 'all'>>({ '1': 'all', '2': 'all', '3': 'all' })
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState<string | null>(null)

  const [showTeacherForm, setShowTeacherForm] = useState(false)
  const [teacherForm, setTeacherForm] = useState({ name: '', loginId: '', password: '' })
  const [teacherSubmitting, setTeacherSubmitting] = useState(false)
  const [teacherError, setTeacherError] = useState('')

  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [magLoaded, setMagLoaded] = useState(false)
  const [magLoading, setMagLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', issue_number: '', publish_date: '', theme: '' })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  async function loadMagazines() {
    if (magLoaded) return
    setMagLoading(true)
    const { data } = await supabase.from('magazines').select('*').order('issue_number', { ascending: false })
    setMagazines(data ?? [])
    setMagLoaded(true)
    setMagLoading(false)
  }

  async function handleTabChange(t: 'members' | 'magazine') {
    setTab(t)
    if (t === 'magazine') loadMagazines()
  }

  async function uploadFile(file: File, bucket: string, path: string): Promise<string | null> {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) { alert('파일 업로드 실패: ' + error.message); return null }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  async function handleMagSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.issue_number || !form.publish_date) {
      alert('제목, 호수, 발행일은 필수입니다.'); return
    }
    setSubmitting(true)
    let cover_url: string | null = null
    let pdf_url: string | null = null
    if (coverFile) {
      const ext = coverFile.name.split('.').pop()
      cover_url = await uploadFile(coverFile, 'magazines', `covers/issue${form.issue_number}.${ext}`)
      if (!cover_url) { setSubmitting(false); return }
    }
    if (pdfFile) {
      pdf_url = await uploadFile(pdfFile, 'magazines', `pdfs/issue${form.issue_number}.pdf`)
      if (!pdf_url) { setSubmitting(false); return }
    }
    const { data, error } = await supabase.from('magazines').insert({
      title: form.title,
      issue_number: Number(form.issue_number),
      publish_date: form.publish_date,
      theme: form.theme || null,
      cover_url,
      pdf_url,
    }).select().single()
    setSubmitting(false)
    if (error) { alert('등록 실패: ' + error.message); return }
    setMagazines((m) => [data, ...m])
    setForm({ title: '', issue_number: '', publish_date: '', theme: '' })
    setCoverFile(null); setPdfFile(null); setShowForm(false)
  }

  async function handleMagDelete(mag: Magazine) {
    if (!confirm(`제${mag.issue_number}호 "${mag.title}"을(를) 삭제하시겠습니까?`)) return
    const { error } = await supabase.from('magazines').delete().eq('id', mag.id)
    if (error) { alert('삭제 실패: ' + error.message); return }
    setMagazines((m) => m.filter((x) => x.id !== mag.id))
  }

  const [bulkLoading, setBulkLoading] = useState(false)

  async function handleBulkApprove() {
    if (!confirm(`대기 중인 ${pending.length}명을 모두 승인하시겠습니까?`)) return
    setBulkLoading(true)
    const ids = pending.map((p) => p.id)
    const { error } = await supabase.from('profiles').update({ status: 'approved' }).in('id', ids)
    setBulkLoading(false)
    if (error) { alert('일괄 승인 실패: ' + error.message); return }
    const approved = pending.map((p) => ({ ...p, status: 'approved' }))
    setUsers((u) => [...approved, ...u])
    setStats((s) => ({ ...s, total: s.total + approved.length, active: s.active + approved.length }))
    setPending([])
  }

  async function handleApproval(id: string, approved: boolean) {
    const status = approved ? 'approved' : 'rejected'
    setLoadingId(id)
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
    setLoadingId(null)
    if (error) { alert('처리 실패: ' + error.message); return }
    const item = pending.find((p) => p.id === id)
    if (!item) return
    setPending((p) => p.filter((u) => u.id !== id))
    if (approved) {
      setUsers((u) => [{ ...item, status: 'approved' }, ...u])
      setStats((s) => ({ ...s, total: s.total + 1, active: s.active + 1 }))
    }
  }

  async function handleRoleChange(id: string, role: string) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) { alert('역할 변경 실패'); return }
    setUsers((u) => u.map((user) => user.id === id ? { ...user, role } : user))
  }

  async function handleStatusToggle(u: Profile) {
    const newStatus = u.status === 'inactive' ? 'approved' : 'inactive'
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', u.id)
    if (error) { alert('상태 변경 실패: ' + error.message); return }
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, status: newStatus } : x))
  }

  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [classForm, setClassForm] = useState({ grade: '', classNum: '', number: '' })

  function startEditClass(u: Profile) {
    setEditingClassId(u.id)
    setClassForm({ grade: String(u.grade ?? ''), classNum: String(u.class ?? ''), number: String(u.number ?? '') })
  }

  async function saveClassInfo(id: string) {
    const { error } = await supabase.from('profiles').update({
      grade: Number(classForm.grade),
      class: Number(classForm.classNum),
      number: Number(classForm.number),
    }).eq('id', id)
    if (error) { alert('저장 실패: ' + error.message); return }
    setUsers((u) => u.map((user) => user.id === id
      ? { ...user, grade: Number(classForm.grade), class: Number(classForm.classNum), number: Number(classForm.number) }
      : user
    ))
    setEditingClassId(null)
  }

  async function handleDeleteUser(u: Profile) {
    if (!confirm(`「${u.name}」 (${u.student_id}) 계정을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
    setLoadingId(u.id)
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id }),
    })
    setLoadingId(null)
    if (!res.ok) {
      const { error } = await res.json()
      alert('삭제 실패: ' + error)
      return
    }
    setUsers((prev) => prev.filter((x) => x.id !== u.id))
    setStats((s) => ({ ...s, total: s.total - 1, active: u.status === 'approved' ? s.active - 1 : s.active }))
  }

  async function handleDeletePending(u: Profile) {
    if (!confirm(`「${u.name}」 (${u.student_id}) 가입 신청을 삭제하시겠습니까?`)) return
    setLoadingId(u.id)
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id }),
    })
    setLoadingId(null)
    if (!res.ok) {
      const { error } = await res.json()
      alert('삭제 실패: ' + error)
      return
    }
    setPending((prev) => prev.filter((x) => x.id !== u.id))
  }

  async function handleCreateTeacher(e: React.FormEvent) {
    e.preventDefault()
    setTeacherError('')
    setTeacherSubmitting(true)
    try {
      const res = await fetch('/api/admin/create-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherForm),
      })
      const json = await res.json()
      if (!res.ok) { setTeacherError(json.error ?? '오류가 발생했습니다.'); return }
      setUsers((u) => [json.user, ...u])
      setStats((s) => ({ ...s, total: s.total + 1, active: s.active + 1 }))
      setTeacherForm({ name: '', loginId: '', password: '' })
      setShowTeacherForm(false)
    } catch {
      setTeacherError('네트워크 오류가 발생했습니다.')
    } finally {
      setTeacherSubmitting(false)
    }
  }

  function getGradeClasses(grade: number) {
    const cls = users
      .filter((u) => u.role !== 'teacher' && u.grade === grade && u.class != null)
      .map((u) => u.class)
    return Array.from(new Set(cls)).sort((a, b) => a - b)
  }

  function getGradeUsers(grade: number) {
    const q = search.trim().toLowerCase()
    const ct = classTabs[String(grade)]
    let list = users.filter((u) => u.role !== 'teacher' && u.grade === grade)
    if (ct !== 'all') list = list.filter((u) => u.class === ct)
    if (q) list = list.filter((u) => u.name.toLowerCase().includes(q) || u.student_id.includes(q))
    return [...list].sort((a, b) => (a.class ?? 0) - (b.class ?? 0) || (a.number ?? 0) - (b.number ?? 0))
  }

  const teacherUsers = useMemo(() => users.filter((u) => u.role === 'teacher'), [users])

  async function handleBulkDelete(grade: number) {
    const ct = classTabs[String(grade)]
    const targets = getGradeUsers(grade)
    if (!targets.length) return
    const label = ct === 'all' ? `${grade}학년 전체` : `${grade}학년 ${ct}반`
    if (!confirm(`${label} ${targets.length}명을 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
    setBulkDeleteLoading(String(grade))
    await Promise.all(targets.map((u) =>
      fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.id }),
      })
    ))
    const ids = new Set(targets.map((u) => u.id))
    setUsers((prev) => prev.filter((u) => !ids.has(u.id)))
    setStats((s) => ({ ...s, total: s.total - targets.length, active: s.active - targets.length }))
    setBulkDeleteLoading(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">

      {/* ── 페이지 헤더 ─────────────────────────────── */}
      <div className="mb-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1 font-sans">Admin Terminal · {teacherName} 선생님</p>
        <h1 className="text-4xl font-serif font-semibold text-primary tracking-tight">관리자 페이지</h1>
        <p className="text-sm text-primary/50 mt-1 uppercase tracking-widest font-sans">Administrative Overview · Active Directory</p>
      </div>

      {/* ── 탭 ─────────────────────────────────────── */}
      <div className="flex gap-1 mb-10 border-b border-primary/10">
        {([['members', '회원 관리', 'group'], ['magazine', '교지 관리', 'menu_book']] as const).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-sans font-semibold border-b-2 -mb-px transition-colors tracking-wide ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-primary/40 hover:text-primary/70'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          교지 관리 탭
      ══════════════════════════════════════════════════ */}
      {tab === 'magazine' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-semibold text-primary">교지 목록</h2>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-cream text-sm font-sans font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus size={15} />
              교지 등록
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleMagSubmit} className="bg-white rounded-2xl border border-primary/10 p-6 flex flex-col gap-4 shadow-sm">
              <h3 className="font-serif font-semibold text-primary text-lg">새 교지 등록</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-1.5 font-sans">호수 *</label>
                  <input type="number" min="1" required
                    value={form.issue_number}
                    onChange={(e) => setForm({ ...form, issue_number: e.target.value })}
                    placeholder="예) 15"
                    className="w-full px-3 py-2.5 rounded-lg border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-1.5 font-sans">발행일 *</label>
                  <input type="date" required
                    value={form.publish_date}
                    onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-1.5 font-sans">제목 *</label>
                  <input type="text" required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="교지 제목"
                    className="w-full px-3 py-2.5 rounded-lg border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 font-sans"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-1.5 font-sans">테마</label>
                <input type="text"
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                  placeholder="예) 자연과 공존 (선택)"
                  className="w-full px-3 py-2.5 rounded-lg border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 font-sans"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-1.5 font-sans">표지 이미지</label>
                  <input ref={coverRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => coverRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-primary/25 text-sm text-primary/50 hover:border-primary/50 hover:text-primary/70 transition-colors font-sans"
                  >
                    <Upload size={14} />
                    {coverFile ? coverFile.name : '이미지 선택 (JPG, PNG)'}
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-1.5 font-sans">PDF 파일</label>
                  <input ref={pdfRef} type="file" accept=".pdf" className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => pdfRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-primary/25 text-sm text-primary/50 hover:border-primary/50 hover:text-primary/70 transition-colors font-sans"
                  >
                    <Upload size={14} />
                    {pdfFile ? pdfFile.name : 'PDF 선택'}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-primary/20 text-sm text-primary/60 hover:bg-surface transition-colors font-sans"
                >취소</button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-cream text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors font-sans"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  등록
                </button>
              </div>
            </form>
          )}

          {magLoading ? (
            <div className="py-16 flex items-center justify-center text-primary/30">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : magazines.length === 0 ? (
            <div className="py-24 flex flex-col items-center gap-3 text-primary/30">
              <BookOpen size={36} strokeWidth={1.5} />
              <p className="text-sm font-sans">등록된 교지가 없습니다.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-primary/10 overflow-hidden shadow-sm">
              <div className="divide-y divide-primary/5">
                {magazines.map((mag) => (
                  <div key={mag.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface/50 transition-colors group">
                    <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-primary to-[#1a4432] flex items-center justify-center shrink-0 overflow-hidden">
                      {mag.cover_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={mag.cover_url} alt={mag.title} className="w-full h-full object-cover" />
                        : <BookOpen size={18} className="text-cream/60" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-primary">{mag.title}</p>
                      <p className="text-xs text-primary/40 mt-0.5 font-sans">제{mag.issue_number}호 · {mag.publish_date?.slice(0, 7)}</p>
                      {mag.theme && <p className="text-xs text-primary/50 mt-1 font-sans line-clamp-1">{mag.theme}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {mag.pdf_url && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-primary-fixed text-primary font-sans">PDF</span>
                      )}
                      <button
                        onClick={() => handleMagDelete(mag)}
                        className="p-2 rounded-lg text-primary/30 hover:text-error hover:bg-error-container/20 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          회원 관리 탭
      ══════════════════════════════════════════════════ */}
      {tab === 'members' && (
        <div className="flex flex-col gap-10">

          {/* ── 통계 카드 ─────────────────────────────── */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white rounded-xl p-6 flex flex-col justify-between border-l-4 border-primary shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50 font-sans">전체 사용자</span>
              <div className="flex items-end justify-between mt-4">
                <span className="font-serif text-5xl font-bold text-primary">{stats.total.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 flex flex-col justify-between border-l-4 border-secondary shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary/60 font-sans">활성 사용자</span>
              <div className="flex items-end justify-between mt-4">
                <span className="font-serif text-5xl font-bold text-secondary">{stats.active.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50 font-sans">승인 대기</span>
              <div className="flex items-end justify-between mt-4">
                <span className="font-serif text-5xl font-bold text-primary">{pending.length}</span>
                {pending.length > 0 && (
                  <span className="material-symbols-outlined text-error">priority_high</span>
                )}
              </div>
            </div>
            <div className="bg-primary rounded-xl p-6 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cream/50 font-sans">이번 달 업로드</span>
              <div className="flex items-end justify-between mt-4">
                <span className="font-serif text-5xl font-bold text-cream">{stats.monthlyUploads.toLocaleString()}</span>
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
              </div>
            </div>
          </section>

          {/* ── 교사 계정 추가 ──────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-primary">교사 계정</h2>
              <button
                onClick={() => { setShowTeacherForm((v) => !v); setTeacherError('') }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-cream text-sm font-sans font-bold hover:bg-secondary/90 transition-colors shadow-sm"
              >
                <UserPlus size={15} />
                교사 계정 추가
              </button>
            </div>

            {showTeacherForm && (
              <form onSubmit={handleCreateTeacher} className="bg-white rounded-2xl border border-primary/10 p-6 flex flex-col gap-4 shadow-sm">
                <h3 className="font-serif font-semibold text-primary text-lg">새 교사 계정 생성</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-1.5 font-sans">이름 *</label>
                    <input type="text" required
                      value={teacherForm.name}
                      onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      placeholder="예) 김교사"
                      className="w-full px-3 py-2.5 rounded-lg border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-1.5 font-sans">로그인 ID *</label>
                    <input type="text" required
                      value={teacherForm.loginId}
                      onChange={(e) => setTeacherForm({ ...teacherForm, loginId: e.target.value.replace(/\s/g, '') })}
                      placeholder="예) teacher01"
                      className="w-full px-3 py-2.5 rounded-lg border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary/50 mb-1.5 font-sans">비밀번호 * (6자 이상)</label>
                    <input type="password" required minLength={6}
                      value={teacherForm.password}
                      onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                      placeholder="6자 이상"
                      className="w-full px-3 py-2.5 rounded-lg border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 font-sans"
                    />
                  </div>
                </div>
                {teacherError && <p className="text-error text-xs font-sans">{teacherError}</p>}
                <div className="flex gap-2 justify-end">
                  <button type="button"
                    onClick={() => { setShowTeacherForm(false); setTeacherError('') }}
                    className="px-4 py-2 rounded-lg border border-primary/20 text-sm text-primary/60 hover:bg-surface transition-colors font-sans"
                  >취소</button>
                  <button type="submit" disabled={teacherSubmitting}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-secondary text-cream text-sm font-bold hover:bg-secondary/90 disabled:opacity-50 transition-colors font-sans"
                  >
                    {teacherSubmitting && <Loader2 size={13} className="animate-spin" />}
                    계정 생성
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* ── 가입 승인 대기 ──────────────────────────── */}
          {pending.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-semibold text-primary flex items-center gap-2">
                  가입 승인 대기
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffdea5] text-secondary text-xs font-bold font-sans">
                    {pending.length}
                  </span>
                </h2>
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-cream text-xs font-bold font-sans hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {bulkLoading ? <Loader2 size={13} className="animate-spin" /> : <span className="material-symbols-outlined text-[14px]">done_all</span>}
                  전체 승인
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-primary/10 overflow-hidden shadow-sm">
                <div className="divide-y divide-primary/5">
                  {pending.map((p) => {
                    const isLoading = loadingId === p.id
                    const initials = p.name.slice(0, 2)
                    return (
                      <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#ffdea5] flex items-center justify-center text-secondary font-bold font-serif text-sm shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-sans font-semibold text-primary text-sm">{p.name}</span>
                            <span className="text-xs text-primary/40 font-sans">{p.student_id}</span>
                          </div>
                          <p className="text-xs text-primary/50 mt-0.5 font-sans">
                            {p.grade}학년 {p.class}반 {p.number}번
                            <span className="ml-2 text-primary/30">
                              {format(new Date(p.created_at), 'yyyy.MM.dd', { locale: ko })} 신청
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleApproval(p.id, true)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-cream text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 font-sans"
                          >
                            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                            승인
                          </button>
                          <button
                            onClick={() => { if (confirm(`${p.name} 님의 가입을 거부하시겠습니까?`)) handleApproval(p.id, false) }}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-error/30 text-error text-xs font-bold hover:bg-error-container/20 transition-colors disabled:opacity-50 font-sans"
                          >
                            <span className="material-symbols-outlined text-[14px]">cancel</span>
                            거부
                          </button>
                          <button
                            onClick={() => handleDeletePending(p)}
                            disabled={isLoading}
                            className="p-2 rounded-lg text-primary/30 hover:text-error hover:bg-error-container/20 transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── 전체 사용자 ───────────────────────── */}
          <section className="flex flex-col gap-8">
            {/* 검색 */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-serif text-xl font-semibold text-primary">전체 사용자</h2>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/30 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="이름, 아이디로 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-lg border border-primary/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 w-56 font-sans"
                />
              </div>
            </div>

            {/* 학년별 표 */}
            {[1, 2, 3].map((grade) => {
              const gradeKey = String(grade)
              const classes = getGradeClasses(grade)
              const gradeUsers = getGradeUsers(grade)
              const ct = classTabs[gradeKey]
              return (
                <div key={grade}>
                  {/* 헤더 */}
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h3 className="font-serif text-lg font-semibold text-primary flex items-center gap-2">
                      {grade}학년
                      <span className="text-sm font-sans font-normal text-primary/40">({gradeUsers.length}명)</span>
                    </h3>
                    <button
                      onClick={() => handleBulkDelete(grade)}
                      disabled={bulkDeleteLoading === gradeKey || gradeUsers.length === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 text-xs font-bold font-sans hover:bg-rose-50 transition-colors disabled:opacity-40"
                    >
                      {bulkDeleteLoading === gradeKey ? <Loader2 size={12} className="animate-spin" /> : <span className="material-symbols-outlined text-[14px]">delete_sweep</span>}
                      {ct === 'all' ? `${grade}학년 전체 삭제` : `${grade}학년 ${ct}반 전체 삭제`}
                    </button>
                  </div>

                  {/* 반 탭 */}
                  {classes.length > 0 && (
                    <div className="flex gap-1 mb-3 flex-wrap">
                      <button
                        onClick={() => setClassTabs((prev) => ({ ...prev, [gradeKey]: 'all' }))}
                        className={`px-3 py-1 rounded-lg text-xs font-sans font-semibold transition-all ${ct === 'all' ? 'bg-primary text-cream' : 'bg-surface text-primary/50 hover:text-primary'}`}
                      >전체</button>
                      {classes.map((c) => (
                        <button
                          key={c}
                          onClick={() => setClassTabs((prev) => ({ ...prev, [gradeKey]: c }))}
                          className={`px-3 py-1 rounded-lg text-xs font-sans font-semibold transition-all ${ct === c ? 'bg-primary text-cream' : 'bg-surface text-primary/50 hover:text-primary'}`}
                        >{c}반</button>
                      ))}
                    </div>
                  )}

                  {/* 표 */}
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ boxShadow: '0 4px 20px -4px rgba(1,45,29,0.08)' }}>
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface border-b border-primary/5">
                        <tr>
                          <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary/60 font-sans">회원 정보</th>
                          <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary/60 font-sans hidden md:table-cell">반 · 번호</th>
                          <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary/60 font-sans">역할</th>
                          <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary/60 font-sans hidden sm:table-cell">상태</th>
                          <th className="px-6 py-3 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                        {gradeUsers.length === 0 ? (
                          <tr><td colSpan={5} className="py-10 text-center text-sm text-primary/30 font-sans">해당 학생이 없습니다.</td></tr>
                        ) : (
                          gradeUsers.map((u) => {
                            const roleMeta = ROLE_LABELS[u.role] ?? ROLE_LABELS['student']
                            const statusMeta = STATUS_LABELS[u.status] ?? STATUS_LABELS['pending']
                            return (
                              <tr key={u.id} className="hover:bg-surface/40 transition-colors group">
                                <td className="px-6 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold font-serif text-sm shrink-0 ${u.role === 'chief_editor' ? 'bg-primary-fixed' : u.role === 'editor' ? 'bg-[#ffdea5]' : 'bg-surface-container'} text-primary`}>
                                      {u.name.slice(0, 2)}
                                    </div>
                                    <div>
                                      <p className="font-sans font-semibold text-primary text-sm">{u.name}</p>
                                      <p className="text-xs text-primary/40 font-sans">{u.student_id}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-3 hidden md:table-cell">
                                  {editingClassId === u.id ? (
                                    <div className="flex items-center gap-1">
                                      <select value={classForm.grade} onChange={(e) => setClassForm({ ...classForm, grade: e.target.value })}
                                        className="px-1.5 py-1 rounded border border-primary/20 text-xs font-sans focus:outline-none w-16">
                                        {[1,2,3].map((g) => <option key={g} value={g}>{g}학년</option>)}
                                      </select>
                                      <select value={classForm.classNum} onChange={(e) => setClassForm({ ...classForm, classNum: e.target.value })}
                                        className="px-1.5 py-1 rounded border border-primary/20 text-xs font-sans focus:outline-none w-14">
                                        {Array.from({length:10},(_,i)=>i+1).map((c) => <option key={c} value={c}>{c}반</option>)}
                                      </select>
                                      <input type="number" min={1} max={50} value={classForm.number}
                                        onChange={(e) => setClassForm({ ...classForm, number: e.target.value })}
                                        className="px-1.5 py-1 rounded border border-primary/20 text-xs font-sans focus:outline-none w-14" placeholder="번호" />
                                      <button onClick={() => saveClassInfo(u.id)} className="text-emerald-600 hover:text-emerald-700">
                                        <span className="material-symbols-outlined text-[16px]">check</span>
                                      </button>
                                      <button onClick={() => setEditingClassId(null)} className="text-primary/30 hover:text-primary/60">
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 group/cell">
                                      <span className="text-sm text-primary/60 font-sans">{u.class}반 {u.number}번</span>
                                      <button onClick={() => startEditClass(u)} className="opacity-0 group-hover/cell:opacity-100 transition-opacity text-primary/30 hover:text-secondary">
                                        <span className="material-symbols-outlined text-[14px]">edit</span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-3">
                                  <div className="relative inline-block">
                                    <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                      className={`appearance-none pl-2.5 pr-6 py-1 rounded-lg text-[10px] font-extrabold tracking-wide uppercase cursor-pointer focus:outline-none font-sans ${roleMeta.bg} ${roleMeta.text}`}>
                                      {ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[12px] opacity-50">expand_more</span>
                                  </div>
                                </td>
                                <td className="px-6 py-3 hidden sm:table-cell">
                                  <button
                                    onClick={() => handleStatusToggle(u)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-sans transition-colors hover:opacity-80 ${statusMeta.bg}`}
                                    title={u.status === 'inactive' ? '클릭하여 활성화' : '클릭하여 비활성화'}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                                    {statusMeta.label}
                                  </button>
                                </td>
                                <td className="px-6 py-3 text-right">
                                  <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDeleteUser(u)} disabled={loadingId === u.id}
                                      className="p-2 rounded-lg text-primary/30 hover:text-error hover:bg-error-container/20 transition-colors disabled:opacity-50">
                                      {loadingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <span className="material-symbols-outlined text-[17px]">delete</span>}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}

            {/* 교사 표 */}
            {teacherUsers.length > 0 && (
              <div>
                <h3 className="font-serif text-lg font-semibold text-primary mb-3">교사</h3>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ boxShadow: '0 4px 20px -4px rgba(1,45,29,0.08)' }}>
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface border-b border-primary/5">
                      <tr>
                        <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary/60 font-sans">회원 정보</th>
                        <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary/60 font-sans hidden sm:table-cell">상태</th>
                        <th className="px-6 py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary/60 font-sans hidden lg:table-cell">가입일</th>
                        <th className="px-6 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {teacherUsers.map((u) => {
                        const statusMeta = STATUS_LABELS[u.status] ?? STATUS_LABELS['approved']
                        return (
                          <tr key={u.id} className="hover:bg-surface/40 transition-colors group">
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold font-serif text-sm shrink-0">
                                  {u.name.slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-sans font-semibold text-primary text-sm">{u.name}</p>
                                  <p className="text-xs text-primary/40 font-sans">{u.student_id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3 hidden sm:table-cell">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-sans ${statusMeta.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className="px-6 py-3 hidden lg:table-cell">
                              <span className="text-xs text-primary/40 font-sans">
                                {format(new Date(u.created_at), 'yyyy.MM.dd', { locale: ko })}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right">
                              {u.id !== currentUserId && isSuperAdmin && (
                                <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleDeleteUser(u)} disabled={loadingId === u.id}
                                    className="p-2 rounded-lg text-primary/30 hover:text-error hover:bg-error-container/20 transition-colors disabled:opacity-50">
                                    {loadingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <span className="material-symbols-outlined text-[17px]">delete</span>}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
