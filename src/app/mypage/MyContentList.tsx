'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Heart, XCircle, MessageSquare, Pencil, Trash2, Loader2, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CATEGORY_COLORS } from '@/components/ContentCard'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: '임시저장', color: 'bg-gray-100 text-gray-500' },
  submitted: { label: '검토 대기', color: 'bg-blue-100 text-blue-600' },
  revision:  { label: '수정 요청', color: 'bg-amber-100 text-amber-600' },
  approved:  { label: '채택',     color: 'bg-emerald-100 text-emerald-600' },
  published: { label: '발행됨',   color: 'bg-[#012d1d]/10 text-[#012d1d]' },
  rejected:  { label: '반려',     color: 'bg-rose-100 text-rose-500' },
}

type Item = {
  id: string
  title: string
  category: string | null
  status: string
  view_count: number
  like_count: number
  created_at: string
  reviewer_comment: string | null
}

export default function MyContentList({ initialContents }: { initialContents: Item[] }) {
  const [contents, setContents] = useState(initialContents)
  const [actionId, setActionId] = useState<string | null>(null)

  const canEdit = (status: string) => ['draft', 'revision', 'rejected'].includes(status)
  const canDelete = (status: string) => ['draft', 'revision', 'rejected'].includes(status)

  async function handleCancelSubmit(item: Item) {
    if (!confirm(`"${item.title}" 제출을 취소하고 임시저장으로 되돌리겠습니까?`)) return
    setActionId(item.id)
    const res = await fetch('/api/content/cancel-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    })
    setActionId(null)
    if (!res.ok) {
      const d = await res.json()
      alert(d.error ?? '취소 실패')
      return
    }
    setContents((prev) => prev.map((c) => c.id === item.id ? { ...c, status: 'draft' } : c))
  }

  async function handleDelete(item: Item) {
    if (!confirm(`"${item.title}" 을(를) 삭제하시겠습니까?`)) return
    setActionId(item.id)
    const res = await fetch('/api/content/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    })
    setActionId(null)
    if (!res.ok) {
      const d = await res.json()
      alert(d.error ?? '삭제 실패')
      return
    }
    setContents((prev) => prev.filter((c) => c.id !== item.id))
  }

  if (contents.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-[#012d1d]/40">
        <span className="text-3xl">📝</span>
        <p className="text-sm">아직 작성한 글이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {contents.map((item) => {
        const st = STATUS_LABELS[item.status] ?? STATUS_LABELS['draft']
        const catColor = CATEGORY_COLORS[item.category ?? ''] ?? CATEGORY_COLORS['기타']
        const isActing = actionId === item.id

        return (
          <div key={item.id} className="bg-white rounded-xl border border-[#012d1d]/10 p-4 flex flex-col gap-2.5">
            {/* 상단: 카테고리 + 상태 + 날짜 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {item.category && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor}`}>{item.category}</span>
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
              </div>
              <span className="text-xs text-[#012d1d]/30 shrink-0">
                {format(new Date(item.created_at), 'yy.MM.dd', { locale: ko })}
              </span>
            </div>

            {/* 제목 */}
            {item.status === 'published' ? (
              <Link href={`/archive/${item.id}`} className="font-semibold text-[#012d1d] hover:text-[#775a19] transition-colors">
                {item.title}
              </Link>
            ) : (
              <p className="font-semibold text-[#012d1d]">{item.title}</p>
            )}

            {/* 수정요청 코멘트 */}
            {item.status === 'revision' && item.reviewer_comment && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <MessageSquare size={13} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700">
                  <span className="font-semibold">편집부 코멘트: </span>{item.reviewer_comment}
                </p>
              </div>
            )}

            {/* 반려 사유 */}
            {item.status === 'rejected' && item.reviewer_comment && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <XCircle size={13} className="text-rose-400 mt-0.5 shrink-0" />
                <p className="text-sm text-rose-600">
                  <span className="font-semibold">반려 사유: </span>{item.reviewer_comment}
                </p>
              </div>
            )}

            {/* 검토 대기 안내 */}
            {item.status === 'submitted' && (
              <p className="text-xs text-[#012d1d]/40">편집부 검토 중 · 영업일 기준 1~3일 소요</p>
            )}

            {/* 하단: 통계 + 액션 버튼 */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-4 text-xs text-[#012d1d]/40">
                <span className="flex items-center gap-1"><Eye size={11} />{item.view_count}</span>
                <span className="flex items-center gap-1"><Heart size={11} />{item.like_count}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* 제출 취소 (submitted → draft) */}
                {item.status === 'submitted' && (
                  <button
                    onClick={() => handleCancelSubmit(item)}
                    disabled={isActing}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#012d1d]/20 text-[#012d1d]/50 text-xs font-medium hover:bg-[#012d1d]/5 transition-colors disabled:opacity-50"
                  >
                    {isActing ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                    제출 취소
                  </button>
                )}
                {/* 편집 */}
                {canEdit(item.status) && (
                  <Link
                    href={`/write/edit/${item.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#012d1d]/20 text-[#012d1d]/60 text-xs font-medium hover:bg-[#012d1d]/5 transition-colors"
                  >
                    <Pencil size={12} />
                    {item.status === 'revision' ? '수정 후 재제출' : '편집'}
                  </Link>
                )}
                {/* 삭제 */}
                {canDelete(item.status) && (
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={isActing}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-400 text-xs font-medium hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    {isActing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    삭제
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
