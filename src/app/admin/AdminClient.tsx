'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Loader2, Search, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

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
  chief_editor: { label: '편집장',  color: 'bg-[#1B4332]/10 text-[#1B4332]' },
  teacher:      { label: '교사',    color: 'bg-[#D4A373]/20 text-[#D4A373]' },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: '대기',  color: 'bg-amber-100 text-amber-600' },
  approved: { label: '승인',  color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '거부',  color: 'bg-rose-100 text-rose-500' },
}

export default function AdminClient({
  initialPending,
  initialUsers,
  initialStats,
}: {
  initialPending: Profile[]
  initialUsers: Profile[]
  initialStats: Stats
}) {
  const supabase = createClient()

  const [pending, setPending] = useState(initialPending)
  const [users, setUsers] = useState(initialUsers)
  const [stats, setStats] = useState(initialStats)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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
      {/* ── 통계 ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#1B4332]/10 p-5">
            <p className="text-3xl font-bold text-[#1B4332]">{s.value.toLocaleString()}</p>
            <p className="text-sm text-[#1B4332]/50 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── 가입 승인 대기 ──────────────────────────── */}
      <section>
        <h2 className="text-base font-bold text-[#1B4332] mb-4 flex items-center gap-2">
          가입 승인 대기
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-xs font-semibold">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <div className="py-12 bg-white rounded-xl border border-[#1B4332]/10 flex flex-col items-center gap-2 text-[#1B4332]/30">
            <CheckCircle2 size={28} />
            <p className="text-sm">대기 중인 가입 신청이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((p) => {
              const isLoading = loadingId === p.id
              return (
                <div key={p.id} className="bg-white rounded-xl border border-[#1B4332]/10 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#1B4332]">{p.name}</span>
                      <span className="text-xs text-[#1B4332]/40">학번 {p.student_id}</span>
                    </div>
                    <p className="text-sm text-[#1B4332]/50 mt-0.5">
                      {p.grade}학년 {p.class_num}반 {p.number}번
                      <span className="ml-2 text-xs text-[#1B4332]/30">
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
          <h2 className="text-base font-bold text-[#1B4332]">
            전체 사용자
            <span className="ml-2 text-sm font-normal text-[#1B4332]/40">({filteredUsers.length}명)</span>
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B4332]/30" />
            <input
              type="text"
              placeholder="이름, 학번으로 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 rounded-lg border border-[#1B4332]/20 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 w-52"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#1B4332]/10 overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr] gap-4 px-5 py-3 bg-[#FEFAE0] border-b border-[#1B4332]/10 text-xs font-semibold text-[#1B4332]/50">
            <span>이름 / 학번</span>
            <span>학년·반</span>
            <span>역할</span>
            <span>상태</span>
            <span>가입일</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-[#1B4332]/30">
              <Search size={24} />
              <p className="text-sm">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1B4332]/5">
              {filteredUsers.map((u) => {
                const roleMeta = ROLE_LABELS[u.role] ?? ROLE_LABELS['student']
                const statusMeta = STATUS_LABELS[u.status] ?? STATUS_LABELS['pending']
                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr_1fr_1.5fr] gap-2 md:gap-4 px-5 py-4 items-center hover:bg-[#FEFAE0]/50 transition-colors"
                  >
                    {/* 이름/학번 */}
                    <div>
                      <p className="font-medium text-[#1B4332] text-sm">{u.name}</p>
                      <p className="text-xs text-[#1B4332]/40">{u.student_id}</p>
                    </div>

                    {/* 학년·반 */}
                    <p className="text-sm text-[#1B4332]/60">
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
                          className={`appearance-none pl-2.5 pr-7 py-1 rounded-full text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 ${roleMeta.color}`}
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
                    <p className="text-xs text-[#1B4332]/40">
                      {format(new Date(u.created_at), 'yyyy.MM.dd', { locale: ko })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
