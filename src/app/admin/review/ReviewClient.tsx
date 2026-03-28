'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CheckCircle, XCircle, ExternalLink, FileText, ArrowLeft, ImagePlus, Loader2, Pencil } from 'lucide-react'

type Submission = {
  id: string
  title: string
  excerpt: string | null
  category: string | null
  created_at: string
  author_id: string
  cover_image_url?: string | null
  profiles: { name: string; grade: number | null } | null
}

type Props = {
  teacherName: string
  initialSubmissions: Submission[]
  stats: { approved: number; pending: number }
}

export default function ReviewClient({ teacherName, initialSubmissions, stats }: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [processing, setProcessing] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [done, setDone] = useState<{ id: string; action: 'approved' | 'rejected' }[]>([])

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    if (processing) return
    setProcessing(id)
    try {
      const status = action === 'approved' ? 'published' : 'rejected'
      const res = await fetch('/api/dashboard/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? '오류가 발생했습니다.')
        return
      }
      setDone((prev) => [...prev, { id, action }])
      setSubmissions((prev) => prev.filter((s) => s.id !== id))
    } finally {
      setProcessing(null)
    }
  }

  async function handleCoverUpload(id: string, file: File | undefined) {
    if (!file) return
    setUploadingId(id)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('id', id)
      const res = await fetch('/api/dashboard/upload-cover', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmissions((prev) =>
        prev.map((s) => s.id === id ? { ...s, cover_image_url: data.url } : s)
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : '업로드 실패')
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">

      {/* 헤더 */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={13} />
          관리자 페이지
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <span className="text-secondary font-sans text-xs tracking-[0.25em] uppercase font-bold block mb-1">Article Review</span>
            <h1 className="font-serif text-3xl text-primary">글 검수</h1>
            <p className="text-sm text-primary/50 mt-1 font-sans">{teacherName} 선생님 · 제출된 글을 검토하고 승인 또는 반려해 주세요</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-5 py-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs text-amber-500 font-sans mt-0.5">검토 대기</p>
            </div>
            <div className="text-center px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
              <p className="text-xs text-emerald-500 font-sans mt-0.5">게시된 글</p>
            </div>
          </div>
        </div>
      </div>

      {/* 처리 완료 알림 */}
      {done.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {done.map((d) => (
            <span
              key={d.id}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium ${
                d.action === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}
            >
              {d.action === 'approved' ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {d.action === 'approved' ? '승인됨' : '반려됨'}
            </span>
          ))}
        </div>
      )}

      {/* 제출 목록 */}
      {submissions.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-4 text-primary/30">
          <FileText size={40} strokeWidth={1} />
          <p className="font-sans text-sm">검토 대기 중인 글이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const profile = Array.isArray(submission.profiles)
              ? (submission.profiles as Submission['profiles'][])[0]
              : submission.profiles
            const authorLabel = profile?.name ?? '알 수 없음'
            const gradeLabel = profile?.grade ? ` · ${profile.grade}학년` : ''
            const isUploading = uploadingId === submission.id
            const isProcessing = processing === submission.id

            return (
              <div
                key={submission.id}
                className="bg-white rounded-2xl border border-primary/8 p-6 flex flex-col gap-4"
              >
                {/* 글 정보 */}
                <div className="flex flex-col sm:flex-row gap-5 sm:items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {submission.category && (
                        <span className="text-[10px] font-bold tracking-widest uppercase bg-primary/5 text-primary/50 px-2.5 py-1 rounded-full font-sans">
                          {submission.category}
                        </span>
                      )}
                      <span className="text-xs text-primary/35 font-sans">
                        {format(new Date(submission.created_at), 'yyyy. M. d.', { locale: ko })}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg text-primary leading-snug mb-1">
                      {submission.title}
                    </h3>
                    {submission.excerpt && (
                      <p className="text-sm text-primary/50 line-clamp-2 font-sans leading-relaxed">
                        {submission.excerpt}
                      </p>
                    )}
                    <p className="text-xs text-primary/40 mt-2 font-sans">
                      작성자: {authorLabel}{gradeLabel}
                    </p>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <Link
                      href={`/write/edit/${submission.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/10 text-xs text-primary/50 font-sans hover:border-primary/20 hover:text-primary transition-colors"
                    >
                      <Pencil size={12} />
                      직접 수정
                    </Link>
                    <Link
                      href={`/archive/${submission.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/10 text-xs text-primary/50 font-sans hover:border-primary/20 hover:text-primary transition-colors"
                    >
                      <ExternalLink size={12} />
                      미리보기
                    </Link>
                    <button
                      onClick={() => handleAction(submission.id, 'approved')}
                      disabled={isProcessing || !!uploadingId}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold font-sans hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle size={13} />
                      승인
                    </button>
                    <button
                      onClick={() => handleAction(submission.id, 'rejected')}
                      disabled={isProcessing || !!uploadingId}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-semibold font-sans hover:bg-rose-100 disabled:opacity-50 transition-colors"
                    >
                      <XCircle size={13} />
                      반려
                    </button>
                  </div>
                </div>

                {/* 커버 이미지 업로드 */}
                <div className="pt-4 border-t border-primary/6 flex items-center gap-4 flex-wrap">
                  {submission.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={submission.cover_image_url}
                      alt="커버"
                      className="w-24 h-16 object-cover rounded-lg border border-primary/10 shrink-0"
                    />
                  )}
                  <label
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/15 text-primary/50 text-xs font-medium font-sans transition-colors ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/5'
                    }`}
                  >
                    {isUploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                    {submission.cover_image_url ? '커버 이미지 변경' : '커버 이미지 추가'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => handleCoverUpload(submission.id, e.target.files?.[0])}
                    />
                  </label>
                  <span className="text-xs text-primary/30 font-sans">승인 전에 커버 이미지를 미리 설정할 수 있습니다</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
