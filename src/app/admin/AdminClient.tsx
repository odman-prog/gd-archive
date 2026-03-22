'use client'

import { useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Loader2, Search, ChevronDown, BookOpen, Plus, Trash2, Upload, UserPlus } from 'lucide-react'
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
  class_num: number
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

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  student:      { label: '학생',    color: 'bg-gray-100 text-gray-600' },
  editor:       { label: '편집부원', color: 'bg-blue-100 text-blue-700' },
  chief_editor: { label: '편집장',  color: 'bg-[#012d1d]/10 text-[#012d1d]' },
  teacher:      { label: '교사',    color: 'bg-[#775a19]/20 text-[#775a19]' },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: '대기',  color: 'bg-amber-100 text-amber-600' },
  approved: { label: '승인',  color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '거부',  color: 'bg-rose-100 text-rose-500' },
}

const supabase = createClient()

export default function AdminClient({
  initialPending,
  initialUsers,
  initialStats,
}: {
  initialPending: Profile[]
  initialUsers: Profile[]
  initialStats: Stats
}) {
  const [tab, setTab] = useState<'members' | 'magazine'>('members')

  // 회원 관리 상태
  const [pending, setPending] = useState(initialPending)
  const [users, setUsers] = useState(initialUsers)
  const [stats, setStats] = useState(initialStats)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // 교사 계정 생성 상태
  const [showTeacherForm, setShowTeacherForm] = useState(false)
  const [teacherForm, setTeacherForm] = useState({ name: '', loginId: '', password: '' })
  const [teacherSubmitting, setTeacherSubmitting] = useState(false)
  const [teacherError, setTeacherError] = useState('')

  // 교지 관리 상태
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [magLoaded, setMagLoaded] = useState(false)
  const [magLoading, setMagLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '', issue_number: '', publish_date: '', theme: '',
  })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  // ── 교지 불러오기 ─────────────────────────────────
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

  // ── 파일 → Supabase Storage 업로드 ────────────────
  async function uploadFile(file: File, bucket: string, path: string): Promise<string | null> {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) { alert('파일 업로드 실패: ' + error.message); return null }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  // ── 교지 등록 ─────────────────────────────────────
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
    setCoverFile(null)
    setPdfFile(null)
    setShowForm(false)
  }

  // ── 교지 삭제 ─────────────────────────────────────
  async function handleMagDelete(mag: Magazine) {
    if (!confirm(`제${mag.issue_number}호 "${mag.title}"을(를) 삭제하시겠습니까?`)) return
    const { error } = await supabase.from('magazines').delete().eq('id', mag.id)
    if (error) { alert('삭제 실패: ' + error.message); return }
    setMagazines((m) => m.filter((x) => x.id !== mag.id))
  }

  // ── 승인 / 거부 ────────────────────────────────────
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

  // ── 역할 변경 ──────────────────────────────────────
  async function handleRoleChange(id: string, role: string) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) { alert('역할 변경 실패'); return }
    setUsers((u) => u.map((user) => user.id === id ? { ...user, role } : user))
  }

  // ── 회원 삭제 ──────────────────────────────────────
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

  // ── 대기자 삭제 ──────────────────────────────────────
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

  // ── 교사 계정 생성 ────────────────────────────────
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

  // ── 검색 필터 ──────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.student_id.includes(q) ||
        String(u.grade).includes(q) ||
        String(u.class_num).includes(q)
    )
  }, [users, search])

  const statCards = [
    { label: '전체 사용자', value: stats.total },
    { label: '활성 사용자', value: stats.active },
    { label: '이번 달 업로드', value: stats.monthlyUploads },
  ]

  return (
    <div className="flex flex-col gap-10">
      {/* ── 탭 ─────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-[#012d1d]/10">
        {([['members', '회원 관리'], ['magazine', '교지 관리']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-[#012d1d] text-[#012d1d]'
                : 'border-transparent text-[#012d1d]/40 hover:text-[#012d1d]/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── 교지 관리 탭 ────────────────────────────── */}
      {tab === 'magazine' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#012d1d]">교지 목록</h2>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#012d1d] text-white text-sm font-medium hover:bg-[#011f16] transition-colors"
            >
              <Plus size={15} />
              교지 등록
            </button>
          </div>

          {/* 등록 폼 */}
          {showForm && (
            <form onSubmit={handleMagSubmit} className="bg-white rounded-xl border border-[#012d1d]/10 p-6 flex flex-col gap-4">
              <h3 className="font-semibold text-[#012d1d]">새 교지 등록</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">호수 *</label>
                  <input type="number" min="1" required
                    value={form.issue_number}
                    onChange={(e) => setForm({ ...form, issue_number: e.target.value })}
                    placeholder="예) 15"
                    className="w-full px-3 py-2 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">발행일 *</label>
                  <input type="date" required
                    value={form.publish_date}
                    onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">제목 *</label>
                  <input type="text" required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="교지 제목"
                    className="w-full px-3 py-2 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">테마</label>
                <input type="text"
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                  placeholder="예) 자연과 공존 (선택)"
                  className="w-full px-3 py-2 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 표지 이미지 */}
                <div>
                  <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">표지 이미지</label>
                  <input ref={coverRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => coverRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#012d1d]/30 text-sm text-[#012d1d]/50 hover:border-[#012d1d]/60 hover:text-[#012d1d]/70 transition-colors"
                  >
                    <Upload size={14} />
                    {coverFile ? coverFile.name : '이미지 선택 (JPG, PNG)'}
                  </button>
                </div>

                {/* PDF */}
                <div>
                  <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">PDF 파일</label>
                  <input ref={pdfRef} type="file" accept=".pdf" className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => pdfRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#012d1d]/30 text-sm text-[#012d1d]/50 hover:border-[#012d1d]/60 hover:text-[#012d1d]/70 transition-colors"
                  >
                    <Upload size={14} />
                    {pdfFile ? pdfFile.name : 'PDF 선택'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-[#012d1d]/20 text-sm text-[#012d1d]/60 hover:bg-[#fdf9ee] transition-colors"
                >
                  취소
                </button>
                <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#012d1d] text-white text-sm font-medium hover:bg-[#011f16] disabled:opacity-50 transition-colors"
                >
                  {submitting && <Loader2 size={13} className="animate-spin" />}
                  등록
                </button>
              </div>
            </form>
          )}

          {/* 교지 목록 */}
          {magLoading ? (
            <div className="py-16 flex items-center justify-center text-[#012d1d]/30">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : magazines.length === 0 ? (
            <div className="py-24 flex flex-col items-center gap-3 text-[#012d1d]/30">
              <BookOpen size={36} />
              <p className="text-sm">등록된 교지가 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {magazines.map((mag) => (
                <div key={mag.id} className="bg-white rounded-xl border border-[#012d1d]/10 p-4 flex items-center gap-4">
                  {/* 표지 썸네일 */}
                  <div className="w-12 h-16 rounded-md bg-gradient-to-br from-[#012d1d] to-[#1a4432] flex items-center justify-center shrink-0 overflow-hidden">
                    {mag.cover_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={mag.cover_url} alt={mag.title} className="w-full h-full object-cover" />
                      : <BookOpen size={18} className="text-[#fdf9ee]/60" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#012d1d] text-sm">{mag.title}</p>
                    <p className="text-xs text-[#012d1d]/40 mt-0.5">제{mag.issue_number}호 · {mag.publish_date?.slice(0, 7)}</p>
                    {mag.theme && <p className="text-xs text-[#012d1d]/50 mt-1 line-clamp-1">{mag.theme}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {mag.pdf_url && (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium">PDF</span>
                    )}
                    <button
                      onClick={() => handleMagDelete(mag)}
                      className="p-1.5 rounded-lg text-[#012d1d]/30 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'members' && <>
      {/* ── 통계 ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#012d1d]/10 p-5">
            <p className="text-3xl font-bold text-[#012d1d]">{s.value.toLocaleString()}</p>
            <p className="text-sm text-[#012d1d]/50 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── 교사 계정 추가 ──────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#012d1d]">교사 계정</h2>
          <button
            onClick={() => { setShowTeacherForm((v) => !v); setTeacherError('') }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#775a19] text-white text-sm font-medium hover:bg-[#c4935f] transition-colors"
          >
            <UserPlus size={14} />
            교사 계정 추가
          </button>
        </div>

        {showTeacherForm && (
          <form onSubmit={handleCreateTeacher} className="bg-white rounded-xl border border-[#012d1d]/10 p-5 flex flex-col gap-4 mb-4">
            <h3 className="text-sm font-semibold text-[#012d1d]">새 교사 계정 생성</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">이름 *</label>
                <input
                  type="text"
                  required
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  placeholder="예) 김교사"
                  className="w-full px-3 py-2 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">로그인 ID *</label>
                <input
                  type="text"
                  required
                  value={teacherForm.loginId}
                  onChange={(e) => setTeacherForm({ ...teacherForm, loginId: e.target.value.replace(/\s/g, '') })}
                  placeholder="예) teacher01"
                  className="w-full px-3 py-2 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">비밀번호 * (6자 이상)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                  placeholder="6자 이상"
                  className="w-full px-3 py-2 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20"
                />
              </div>
            </div>
            {teacherError && <p className="text-rose-500 text-xs">{teacherError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowTeacherForm(false); setTeacherError('') }}
                className="px-4 py-2 rounded-lg border border-[#012d1d]/20 text-sm text-[#012d1d]/60 hover:bg-[#fdf9ee] transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={teacherSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#775a19] text-white text-sm font-medium hover:bg-[#c4935f] disabled:opacity-50 transition-colors"
              >
                {teacherSubmitting && <Loader2 size={13} className="animate-spin" />}
                계정 생성
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── 가입 승인 대기 ──────────────────────────── */}
      <section>
        <h2 className="text-base font-bold text-[#012d1d] mb-4 flex items-center gap-2">
          가입 승인 대기
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-xs font-semibold">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <div className="py-12 bg-white rounded-xl border border-[#012d1d]/10 flex flex-col items-center gap-2 text-[#012d1d]/30">
            <CheckCircle2 size={28} />
            <p className="text-sm">대기 중인 가입 신청이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((p) => {
              const isLoading = loadingId === p.id
              return (
                <div key={p.id} className="bg-white rounded-xl border border-[#012d1d]/10 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#012d1d]">{p.name}</span>
                      <span className="text-xs text-[#012d1d]/40">학번 {p.student_id}</span>
                    </div>
                    <p className="text-sm text-[#012d1d]/50 mt-0.5">
                      {p.grade}학년 {p.class_num}반 {p.number}번
                      <span className="ml-2 text-xs text-[#012d1d]/30">
                        {format(new Date(p.created_at), 'yyyy.MM.dd', { locale: ko })} 신청
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApproval(p.id, true)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      승인
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`${p.name} 님의 가입을 거부하시겠습니까?`)) handleApproval(p.id, false)
                      }}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={13} />
                      거부
                    </button>
                    <button
                      onClick={() => handleDeletePending(p)}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-rose-200 text-rose-400 text-sm font-medium hover:bg-rose-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── 전체 사용자 목록 ────────────────────────── */}
      <section>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-base font-bold text-[#012d1d]">
            전체 사용자
            <span className="ml-2 text-sm font-normal text-[#012d1d]/40">({filteredUsers.length}명)</span>
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#012d1d]/30" />
            <input
              type="text"
              placeholder="이름, 학번으로 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 rounded-lg border border-[#012d1d]/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20 w-52"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#012d1d]/10 overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr_auto] gap-4 px-5 py-3 bg-[#fdf9ee] border-b border-[#012d1d]/10 text-xs font-semibold text-[#012d1d]/50">
            <span>이름 / 학번</span>
            <span>학년·반</span>
            <span>역할</span>
            <span>상태</span>
            <span>가입일</span>
            <span></span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-[#012d1d]/30">
              <Search size={24} />
              <p className="text-sm">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#012d1d]/5">
              {filteredUsers.map((u) => {
                const roleMeta = ROLE_LABELS[u.role] ?? ROLE_LABELS['student']
                const statusMeta = STATUS_LABELS[u.status] ?? STATUS_LABELS['pending']
                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr_auto] gap-2 md:gap-4 px-5 py-4 items-center hover:bg-[#fdf9ee]/50 transition-colors"
                  >
                    {/* 이름/학번 */}
                    <div>
                      <p className="font-medium text-[#012d1d] text-sm">{u.name}</p>
                      <p className="text-xs text-[#012d1d]/40">{u.student_id}</p>
                    </div>

                    {/* 학년·반 */}
                    <p className="text-sm text-[#012d1d]/60">
                      {u.grade}-{u.class_num}
                    </p>

                    {/* 역할 변경 드롭다운 (teacher는 변경 불가) */}
                    {u.role === 'teacher' ? (
                      <span className={`self-start inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${roleMeta.color}`}>
                        {roleMeta.label}
                      </span>
                    ) : (
                      <div className="relative self-start">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className={`appearance-none pl-2.5 pr-7 py-1 rounded-full text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20 ${roleMeta.color}`}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                    )}

                    {/* 상태 */}
                    <span className={`self-start inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${statusMeta.color}`}>
                      {statusMeta.label}
                    </span>

                    {/* 가입일 */}
                    <p className="text-xs text-[#012d1d]/40">
                      {format(new Date(u.created_at), 'yyyy.MM.dd', { locale: ko })}
                    </p>

                    {/* 삭제 (teacher 본인은 삭제 불가) */}
                    {u.role !== 'teacher' && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        disabled={loadingId === u.id}
                        title="계정 삭제"
                        className="p-1.5 rounded-lg text-[#012d1d]/30 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        {loadingId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
      </>}
    </div>
  )
}
