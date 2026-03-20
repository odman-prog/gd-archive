'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_COLORS } from '@/components/ContentCard'
import {
  CheckCircle2, MessageSquare, XCircle, Globe, Star, StarOff, Loader2, X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

type Content = {
  id: string
  title: string
  category: string | null
  status: string
  featured: boolean
  created_at: string
  profiles: { name: string; grade?: number | null; class_num?: number | null } | null
}

type Stats = {
  submitted: number
  approved: number
  revision: number
  published: number
}

type Tab = 'review' | 'publish'

export default function DashboardClient({
  initialStats,
  initialPending,
  initialApproved,
}: {
  initialStats: Stats
  initialPending: Content[]
  initialApproved: Content[]
}) {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('review')
  const [stats, setStats] = useState(initialStats)
  const [pending, setPending] = useState(initialPending)
  const [approved, setApproved] = useState(initialApproved)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // 수정요청 모달
  const [revisionModal, setRevisionModal] = useState<{ id: string; title: string } | null>(null)
  const [revisionComment, setRevisionComment] = useState('')

  // ── 상태 변경 ─────────────────────────────────────
  async function changeStatus(id: string, status: string, comment?: string) {
    setLoadingId(id)
    const update: Record<string, unknown> = { status }
    if (comment) update.revision_comment = comment

    const { error } = await supabase.from('contents').update(update).eq('id', id)
    setLoadingId(null)
    if (error) { alert('변경 실패: ' + error.message); return }

    // 로컬 상태 업데이트
    if (status === 'approved') {
      const item = pending.find((c) => c.id === id)
      if (item) {
        setPending((p) => p.filter((c) => c.id !== id))
        setApproved((a) => [{ ...item, status: 'approved' }, ...a])
        setStats((s) => ({ ...s, submitted: s.submitted - 1, approved: s.approved + 1 }))
      }
    } else if (status === 'revision' || status === 'rejected') {
      setPending((p) => p.filter((c) => c.id !== id))
      setStats((s) => ({
        ...s,
        submitted: s.submitted - 1,
        revision: status === 'revision' ? s.revision + 1 : s.revision,
      }))
    } else if (status === 'published') {
      const item = approved.find((c) => c.id === id)
      if (item) {
        setApproved((a) => a.filter((c) => c.id !== id))
        setStats((s) => ({ ...s, approved: s.approved - 1, published: s.published + 1 }))
      }
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    setLoadingId(id)
    const { error } = await supabase.from('contents').update({ featured: !current }).eq('id', id)
    setLoadingId(null)
    if (error) { alert('변경 실패'); return }
    setApproved((a) => a.map((c) => c.id === id ? { ...c, featured: !current } : c))
  }

  async function handleRevisionSubmit() {
    if (!revisionModal) return
    await changeStatus(revisionModal.id, 'revision', revisionComment)
    setRevisionModal(null)
    setRevisionComment('')
  }

  // ── 공통 카드 ─────────────────────────────────────
  function AuthorLabel({ profile }: { profile: Content['profiles'] }) {
    if (!profile) return <span className="text-[#1B4332]/40">알 수 없음</span>
    return (
      <span className="text-[#1B4332]/60">
        {profile.name}
        {profile.grade && profile.class_num && ` · ${profile.grade}-${profile.class_num}`}
      </span>
    )
  }

  const statCards = [
    { label: '접수 대기', value: stats.submitted, color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: '채택 완료', value: stats.approved, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { label: '수정 요청', value: stats.revision, color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { label: '발행 완료', value: stats.published, color: 'bg-[#1B4332]/5 text-[#1B4332] border-[#1B4332]/10' },
  ]

  return (
    <div>
      {/* ── 통계 카드 ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 ${s.color}`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── 탭 ────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 border-b border-[#1B4332]/10">
        {(['review', 'publish'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-[#1B4332] text-[#1B4332]'
                : 'border-transparent text-[#1B4332]/40 hover:text-[#1B4332]'
            }`}
          >
            {t === 'review' ? `검토 대기 원고 (${pending.length})` : `발행 관리 (${approved.length})`}
          </button>
        ))}
      </div>

      {/* ── 검토 대기 탭 ────────────────────────────── */}
      {tab === 'review' && (
        <div className="flex flex-col gap-3">
          {pending.length === 0 ? (
            <Empty message="검토 대기 중인 원고가 없습니다." />
          ) : (
            pending.map((item) => {
              const categoryColor = CATEGORY_COLORS[item.category ?? ''] ?? CATEGORY_COLORS['기타']
              const isLoading = loadingId === item.id
              return (
                <div key={item.id} className="bg-white rounded-xl border border-[#1B4332]/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.category && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor}`}>{item.category}</span>
                      )}
                      <span className="text-xs text-[#1B4332]/30">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ko })}
                      </span>
                    </div>
                    <p className="font-semibold text-[#1B4332] truncate">{item.title}</p>
                    <AuthorLabel profile={item.profiles} />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => changeStatus(item.id, 'approved')}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      채택
                    </button>
                    <button
                      onClick={() => setRevisionModal({ id: item.id, title: item.title })}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      <MessageSquare size={13} />
                      수정요청
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${item.title}" 을(를) 반려하시겠습니까?`)) changeStatus(item.id, 'rejected')
                      }}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={13} />
                      반려
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── 발행 관리 탭 ────────────────────────────── */}
      {tab === 'publish' && (
        <div className="flex flex-col gap-3">
          {approved.length === 0 ? (
            <Empty message="발행 대기 중인 원고가 없습니다." />
          ) : (
            approved.map((item) => {
              const categoryColor = CATEGORY_COLORS[item.category ?? ''] ?? CATEGORY_COLORS['기타']
              const isLoading = loadingId === item.id
              return (
                <div key={item.id} className="bg-white rounded-xl border border-[#1B4332]/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.category && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor}`}>{item.category}</span>
                      )}
                      {item.featured && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#D4A373]/20 text-[#D4A373]">✦ PICK</span>
                      )}
                    </div>
                    <p className="font-semibold text-[#1B4332] truncate">{item.title}</p>
                    <AuthorLabel profile={item.profiles} />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => toggleFeatured(item.id, item.featured)}
                      disabled={isLoading}
                      title={item.featured ? 'PICK 해제' : '편집부 PICK 지정'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                        item.featured
                          ? 'bg-[#D4A373]/20 text-[#D4A373] hover:bg-[#D4A373]/30'
                          : 'bg-[#1B4332]/5 text-[#1B4332]/50 hover:bg-[#D4A373]/10 hover:text-[#D4A373]'
                      }`}
                    >
                      {item.featured ? <Star size={13} className="fill-current" /> : <StarOff size={13} />}
                      {item.featured ? 'PICK 해제' : 'PICK 지정'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${item.title}" 을(를) 발행하시겠습니까?`)) changeStatus(item.id, 'published')
                      }}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B4332] text-[#FEFAE0] text-xs font-medium hover:bg-[#163728] transition-colors disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
                      발행
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── 수정요청 모달 ────────────────────────────── */}
      {revisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-[#1B4332]">수정 요청</h2>
                <p className="text-sm text-[#1B4332]/50 mt-0.5 line-clamp-1">{revisionModal.title}</p>
              </div>
              <button onClick={() => { setRevisionModal(null); setRevisionComment('') }} className="text-[#1B4332]/30 hover:text-[#1B4332]">
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B4332] mb-1.5">코멘트</label>
              <textarea
                rows={4}
                placeholder="수정이 필요한 내용을 구체적으로 작성해주세요."
                value={revisionComment}
                onChange={(e) => setRevisionComment(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#1B4332]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setRevisionModal(null); setRevisionComment('') }}
                className="px-4 py-2 rounded-lg text-sm text-[#1B4332]/60 border border-[#1B4332]/15 hover:border-[#1B4332]/30 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleRevisionSubmit}
                disabled={!revisionComment.trim() || loadingId === revisionModal.id}
                className="px-4 py-2 rounded-lg text-sm bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {loadingId === revisionModal.id && <Loader2 size={13} className="animate-spin" />}
                수정 요청 전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <div className="py-20 flex flex-col items-center gap-3 text-[#1B4332]/30">
      <span className="text-3xl">📋</span>
      <p className="text-sm">{message}</p>
    </div>
  )
}
