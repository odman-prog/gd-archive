'use client'

import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Globe, MessageSquare, XCircle, Trash2,
  Star, StarOff, Loader2, X, FileText, Download, EyeOff, BarChart2, RotateCcw,
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CATEGORY_COLORS } from '@/components/ContentCard'

type Item = {
  id: string
  title: string
  excerpt: string | null
  body: string | null
  category: string | null
  status: string
  created_at: string
  file_url: string | null
  file_name: string | null
  featured?: boolean
  reviewer_comment?: string | null
  resubmit_count?: number
  author: { name: string; grade: number | null } | null
}

type StudentStat = {
  id: string; name: string; grade: number | null; class: number | null
  submitted: number; published: number; revision: number; rejected: number; draft: number
}

const DONE_STATUS: Record<string, { label: string; color: string }> = {
  revision: { label: '수정 요청', color: 'bg-amber-100 text-amber-600' },
  rejected: { label: '반려',     color: 'bg-rose-100 text-rose-500' },
}

export default function DashboardClient({
  submitted: initialSubmitted,
  published: initialPublished,
  done: initialDone,
  role,
  studentStats,
}: {
  submitted: Item[]
  published: Item[]
  done: Item[]
  role: string
  studentStats: StudentStat[]
}) {
  const [tab, setTab] = useState<'submitted' | 'published' | 'done' | 'stats'>('submitted')
  const [submitted, setSubmitted] = useState(initialSubmitted)
  const [published, setPublished] = useState(initialPublished)
  const [done, setDone] = useState(initialDone)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const [revModal, setRevModal] = useState<{ id: string; title: string } | null>(null)
  const [revComment, setRevComment] = useState('')

  async function callAPI(path: string, body: object) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error ?? '오류 발생')
    }
  }

  async function publish(item: Item) {
    if (!confirm(`"${item.title}" 을(를) 발행하시겠습니까?`)) return
    setLoadingId(item.id)
    try {
      await callAPI('/api/dashboard/update-status', { id: item.id, status: 'published' })
      setSubmitted((p) => p.filter((c) => c.id !== item.id))
      setPublished((p) => [{ ...item, featured: false }, ...p])
      if (expanded === item.id) setExpanded(null)
    } catch (e) { alert(e instanceof Error ? e.message : '오류') }
    setLoadingId(null)
  }

  async function reject(item: Item) {
    if (!confirm(`"${item.title}" 을(를) 반려하시겠습니까?`)) return
    setLoadingId(item.id)
    try {
      await callAPI('/api/dashboard/update-status', { id: item.id, status: 'rejected' })
      setSubmitted((p) => p.filter((c) => c.id !== item.id))
      setDone((p) => [{ ...item, status: 'rejected' }, ...p])
      if (expanded === item.id) setExpanded(null)
    } catch (e) { alert(e instanceof Error ? e.message : '오류') }
    setLoadingId(null)
  }

  async function sendRevision() {
    if (!revModal || !revComment.trim()) return
    setLoadingId(revModal.id)
    try {
      const item = submitted.find((c) => c.id === revModal.id)
      await callAPI('/api/dashboard/update-status', {
        id: revModal.id,
        status: 'revision',
        reviewer_comment: revComment.trim(),
      })
      setSubmitted((p) => p.filter((c) => c.id !== revModal.id))
      if (item) setDone((p) => [{ ...item, status: 'revision', reviewer_comment: revComment.trim() }, ...p])
      setRevModal(null)
      setRevComment('')
    } catch (e) { alert(e instanceof Error ? e.message : '오류') }
    setLoadingId(null)
  }

  async function deleteItem(item: Item, from: 'submitted' | 'published' | 'done') {
    if (!confirm(`"${item.title}" 을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
    setLoadingId(item.id)
    try {
      await callAPI('/api/dashboard/delete-content', { id: item.id })
      if (from === 'submitted') setSubmitted((p) => p.filter((c) => c.id !== item.id))
      else if (from === 'published') setPublished((p) => p.filter((c) => c.id !== item.id))
      else setDone((p) => p.filter((c) => c.id !== item.id))
      if (expanded === item.id) setExpanded(null)
    } catch (e) { alert(e instanceof Error ? e.message : '오류') }
    setLoadingId(null)
  }

  async function toggleFeatured(item: Item) {
    setLoadingId(item.id)
    try {
      await callAPI('/api/dashboard/update-status', { id: item.id, featured: !item.featured })
      setPublished((p) => p.map((c) => c.id === item.id ? { ...c, featured: !c.featured } : c))
    } catch (e) { alert(e instanceof Error ? e.message : '오류') }
    setLoadingId(null)
  }

  async function unpublish(item: Item) {
    if (!confirm(`"${item.title}" 을(를) 비공개로 전환하시겠습니까?\n아카이브에서 숨겨지고 접수 대기 상태로 이동합니다.`)) return
    setLoadingId(item.id)
    try {
      await callAPI('/api/dashboard/update-status', { id: item.id, status: 'submitted' })
      setPublished((p) => p.filter((c) => c.id !== item.id))
      setSubmitted((p) => [{ ...item, featured: false, status: 'submitted' }, ...p])
      if (expanded === item.id) setExpanded(null)
    } catch (e) { alert(e instanceof Error ? e.message : '오류') }
    setLoadingId(null)
  }

  // 반려/수정요청 → 다시 접수 대기로 복구
  async function reopenItem(item: Item) {
    if (!confirm(`"${item.title}" 을(를) 다시 접수 대기로 이동하시겠습니까?`)) return
    setLoadingId(item.id)
    try {
      await callAPI('/api/dashboard/update-status', { id: item.id, status: 'submitted' })
      setDone((p) => p.filter((c) => c.id !== item.id))
      setSubmitted((p) => [{ ...item, status: 'submitted' }, ...p])
      if (expanded === item.id) setExpanded(null)
    } catch (e) { alert(e instanceof Error ? e.message : '오류') }
    setLoadingId(null)
  }

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  const list = tab === 'submitted' ? submitted : tab === 'published' ? published : done

  // 펼쳐보기 내용 렌더링 (공통)
  function renderExpanded(item: Item) {
    return (
      <div className="px-14 pb-5 border-t border-[#012d1d]/6 bg-[#fdf9ee]/30">
        {/* 재제출 시 이전 수정 요청 코멘트 표시 */}
        {(item.resubmit_count ?? 0) > 0 && item.reviewer_comment && (
          <div className="pt-3 pb-1">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <MessageSquare size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">이전 수정 요청: </span>{item.reviewer_comment}
              </p>
            </div>
          </div>
        )}
        {/* 처리 완료 탭의 코멘트 */}
        {tab === 'done' && item.reviewer_comment && (
          <div className="pt-3 pb-1">
            <div className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${
              item.status === 'revision'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-rose-50 border-rose-200'
            }`}>
              <MessageSquare size={13} className={`mt-0.5 shrink-0 ${item.status === 'revision' ? 'text-amber-500' : 'text-rose-400'}`} />
              <p className={`text-xs ${item.status === 'revision' ? 'text-amber-700' : 'text-rose-600'}`}>
                <span className="font-semibold">전송된 코멘트: </span>{item.reviewer_comment}
              </p>
            </div>
          </div>
        )}
        {/* 본문 */}
        {item.body ? (
          <div className="py-4">
            <p className="text-xs font-semibold text-[#012d1d]/40 mb-2">본문</p>
            <p className="text-sm text-[#012d1d]/80 leading-relaxed whitespace-pre-wrap">{item.body}</p>
            {item.excerpt && (
              <div className="mt-4 pt-3 border-t border-[#012d1d]/8">
                <p className="text-xs font-semibold text-[#012d1d]/40 mb-1">요약</p>
                <p className="text-xs text-[#012d1d]/60 leading-relaxed">{item.excerpt}</p>
              </div>
            )}
          </div>
        ) : item.excerpt ? (
          <div className="py-4">
            <p className="text-xs font-semibold text-[#012d1d]/40 mb-2">내용 요약</p>
            <p className="text-sm text-[#012d1d]/80 leading-relaxed whitespace-pre-wrap">{item.excerpt}</p>
          </div>
        ) : (
          <p className="py-4 text-sm text-[#012d1d]/30 italic">본문 없음 — 첨부파일을 확인하세요.</p>
        )}
        {item.file_url && item.file_name && (
          <div className="flex items-center gap-3 mt-1 p-3 bg-white rounded-lg border border-[#012d1d]/10 w-fit">
            <FileText size={15} className="text-[#012d1d]/40 shrink-0" />
            <span className="text-sm text-[#012d1d] max-w-xs truncate">{item.file_name}</span>
            <a
              href={item.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#012d1d] text-[#fdf9ee] text-xs font-medium hover:bg-[#011f16] transition-colors shrink-0"
            >
              <Download size={12} />
              열기
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-0 mb-6 border border-[#012d1d]/15 rounded-lg overflow-hidden w-fit flex-wrap">
        {[
          { key: 'submitted', label: '접수 대기', count: submitted.length },
          { key: 'published', label: '발행 완료', count: published.length },
          { key: 'done',      label: '처리 완료', count: done.length },
        ].map(({ key, label, count }, i) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${i > 0 ? 'border-l border-[#012d1d]/15' : ''} ${
              tab === key ? 'bg-[#012d1d] text-[#fdf9ee]' : 'bg-white text-[#012d1d]/50 hover:text-[#012d1d]'
            }`}
          >
            {label} <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs font-bold ${tab === key ? 'bg-white/20' : 'bg-[#012d1d]/10'}`}>{count}</span>
          </button>
        ))}
        {role === 'teacher' && (
          <button
            onClick={() => setTab('stats')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors border-l border-[#012d1d]/15 ${
              tab === 'stats' ? 'bg-[#012d1d] text-[#fdf9ee]' : 'bg-white text-[#012d1d]/50 hover:text-[#012d1d]'
            }`}
          >
            <BarChart2 size={14} />
            제출 현황
          </button>
        )}
      </div>

      {/* 제출 현황 탭 */}
      {tab === 'stats' && (
        <div>
          {studentStats.length === 0 ? (
            <div className="py-24 flex flex-col items-center gap-3 text-[#012d1d]/30 bg-white rounded-xl border border-[#012d1d]/10">
              <span className="text-3xl">📋</span>
              <p className="text-sm">승인된 학생이 없습니다.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-[#012d1d]/10 overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-[#fdf9ee] border-b border-[#012d1d]/10 text-xs font-semibold text-[#012d1d]/50">
                <span>이름</span>
                <span className="text-center">접수 대기</span>
                <span className="text-center">발행</span>
                <span className="text-center">수정 요청</span>
                <span className="text-center">반려</span>
                <span className="text-center">임시저장</span>
              </div>
              {studentStats.map((s, idx) => {
                const total = s.submitted + s.published + s.revision + s.rejected + s.draft
                return (
                  <div key={s.id} className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 items-center ${idx > 0 ? 'border-t border-[#012d1d]/8' : ''} bg-white`}>
                    <div>
                      <p className="text-sm font-semibold text-[#012d1d]">{s.name}</p>
                      <p className="text-xs text-[#012d1d]/40 mt-0.5">
                        {s.grade ? `${s.grade}학년` : ''}{s.class ? ` ${s.class}반` : ''}{total > 0 ? ` · 총 ${total}편` : ' · 미제출'}
                      </p>
                    </div>
                    <span className={`text-center text-sm font-semibold ${s.submitted > 0 ? 'text-amber-500' : 'text-[#012d1d]/20'}`}>{s.submitted || '—'}</span>
                    <span className={`text-center text-sm font-semibold ${s.published > 0 ? 'text-emerald-600' : 'text-[#012d1d]/20'}`}>{s.published || '—'}</span>
                    <span className={`text-center text-sm font-semibold ${s.revision > 0 ? 'text-blue-500' : 'text-[#012d1d]/20'}`}>{s.revision || '—'}</span>
                    <span className={`text-center text-sm font-semibold ${s.rejected > 0 ? 'text-rose-400' : 'text-[#012d1d]/20'}`}>{s.rejected || '—'}</span>
                    <span className={`text-center text-sm ${s.draft > 0 ? 'text-[#012d1d]/40' : 'text-[#012d1d]/20'}`}>{s.draft || '—'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 목록 탭 (submitted / published / done) */}
      {tab !== 'stats' && (list.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-3 text-[#012d1d]/30 bg-white rounded-xl border border-[#012d1d]/10">
          <span className="text-3xl">📋</span>
          <p className="text-sm">
            {tab === 'submitted' ? '접수된 원고가 없습니다.' : tab === 'published' ? '발행된 글이 없습니다.' : '처리된 원고가 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col rounded-xl border border-[#012d1d]/10 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-[#fdf9ee] border-b border-[#012d1d]/10 text-xs font-semibold text-[#012d1d]/50">
            <span>제목 / 작성자</span>
            <span>카테고리</span>
            <span>날짜</span>
            <span>액션</span>
          </div>

          {list.map((item, idx) => {
            const isOpen = expanded === item.id
            const isLoading = loadingId === item.id
            const catColor = CATEGORY_COLORS[item.category ?? ''] ?? CATEGORY_COLORS['기타']
            const authorStr = item.author
              ? item.author.grade ? `${item.author.name} · ${item.author.grade}학년` : item.author.name
              : '알 수 없음'
            const isResubmit = (item.resubmit_count ?? 0) > 0

            return (
              <div key={item.id} className={`${idx > 0 ? 'border-t border-[#012d1d]/8' : ''} bg-white`}>
                <div
                  className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 md:gap-4 px-5 py-4 items-center cursor-pointer hover:bg-[#fdf9ee]/60 transition-colors"
                  onClick={() => toggle(item.id)}
                >
                  {/* 제목 + 작성자 */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="transition-transform shrink-0 text-[#012d1d]/30">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#012d1d] truncate text-sm">{item.title}</p>
                        {isResubmit && tab === 'submitted' && (
                          <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">재제출</span>
                        )}
                        {item.featured && (
                          <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#775a19]/20 text-[#775a19]">PICK</span>
                        )}
                        {tab === 'done' && DONE_STATUS[item.status] && (
                          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${DONE_STATUS[item.status].color}`}>
                            {DONE_STATUS[item.status].label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#012d1d]/40 mt-0.5">{authorStr}</p>
                    </div>
                  </div>

                  {/* 카테고리 */}
                  <div onClick={(e) => e.stopPropagation()}>
                    {item.category && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}>
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* 날짜 */}
                  <p className="text-xs text-[#012d1d]/40 shrink-0">
                    {format(new Date(item.created_at), 'yy.MM.dd', { locale: ko })}
                  </p>

                  {/* 액션 버튼 */}
                  <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {tab === 'submitted' && (
                      <>
                        <button onClick={() => publish(item)} disabled={isLoading}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#012d1d] text-[#fdf9ee] text-xs font-medium hover:bg-[#011f16] transition-colors disabled:opacity-50">
                          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />} 발행
                        </button>
                        <button onClick={() => setRevModal({ id: item.id, title: item.title })} disabled={isLoading}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-600 text-xs font-medium hover:bg-amber-50 transition-colors disabled:opacity-50">
                          <MessageSquare size={12} /> 수정
                        </button>
                        <button onClick={() => reject(item)} disabled={isLoading}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-400 text-xs font-medium hover:bg-rose-50 transition-colors disabled:opacity-50">
                          <XCircle size={12} /> 반려
                        </button>
                        <button onClick={() => deleteItem(item, 'submitted')} disabled={isLoading}
                          className="p-1.5 rounded-lg text-[#012d1d]/25 hover:text-rose-400 hover:bg-rose-50 transition-colors disabled:opacity-50">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    {tab === 'published' && (
                      <>
                        <button onClick={() => toggleFeatured(item)} disabled={isLoading}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                            item.featured ? 'bg-[#775a19]/20 text-[#775a19] hover:bg-[#775a19]/30' : 'border border-[#012d1d]/15 text-[#012d1d]/40 hover:bg-[#775a19]/10 hover:text-[#775a19]'
                          }`}>
                          {isLoading ? <Loader2 size={12} className="animate-spin" /> : item.featured ? <Star size={12} className="fill-current" /> : <StarOff size={12} />}
                          {item.featured ? 'PICK 해제' : 'PICK'}
                        </button>
                        <button onClick={() => unpublish(item)} disabled={isLoading}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#012d1d]/15 text-[#012d1d]/40 text-xs font-medium hover:bg-slate-50 hover:text-[#012d1d]/60 transition-colors disabled:opacity-50">
                          <EyeOff size={12} /> 비공개
                        </button>
                        <button onClick={() => deleteItem(item, 'published')} disabled={isLoading}
                          className="p-1.5 rounded-lg text-[#012d1d]/25 hover:text-rose-400 hover:bg-rose-50 transition-colors disabled:opacity-50">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    {tab === 'done' && (
                      <>
                        <button onClick={() => reopenItem(item)} disabled={isLoading}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#012d1d]/15 text-[#012d1d]/40 text-xs font-medium hover:bg-[#012d1d]/5 transition-colors disabled:opacity-50">
                          {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                          다시 접수
                        </button>
                        <button onClick={() => deleteItem(item, 'done')} disabled={isLoading}
                          className="p-1.5 rounded-lg text-[#012d1d]/25 hover:text-rose-400 hover:bg-rose-50 transition-colors disabled:opacity-50">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isOpen && renderExpanded(item)}
              </div>
            )
          })}
        </div>
      ))}

      {/* 수정요청 모달 */}
      {revModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-[#012d1d]">수정 요청</h2>
                <p className="text-sm text-[#012d1d]/50 mt-0.5 line-clamp-1">{revModal.title}</p>
              </div>
              <button onClick={() => { setRevModal(null); setRevComment('') }} className="text-[#012d1d]/30 hover:text-[#012d1d]">
                <X size={20} />
              </button>
            </div>
            {/* 이전 코멘트 표시 */}
            {(() => {
              const item = submitted.find((c) => c.id === revModal.id)
              return item?.reviewer_comment ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-700">
                    <span className="font-semibold">이전 수정 요청: </span>{item.reviewer_comment}
                  </p>
                </div>
              ) : null
            })()}
            <textarea
              rows={4}
              placeholder="수정이 필요한 내용을 구체적으로 작성해주세요."
              value={revComment}
              onChange={(e) => setRevComment(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setRevModal(null); setRevComment('') }}
                className="px-4 py-2 rounded-lg text-sm text-[#012d1d]/60 border border-[#012d1d]/15 hover:border-[#012d1d]/30 transition-colors">
                취소
              </button>
              <button onClick={sendRevision} disabled={!revComment.trim() || loadingId === revModal.id}
                className="px-4 py-2 rounded-lg text-sm bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {loadingId === revModal.id && <Loader2 size={13} className="animate-spin" />}
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
