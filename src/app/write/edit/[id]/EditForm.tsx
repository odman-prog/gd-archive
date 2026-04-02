'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone, FileRejection } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, FileText, CheckCircle2, Loader2, Save, Send, Paperclip } from 'lucide-react'

const CATEGORIES = ['기사', '에세이', '인터뷰', '시/수필', '독서감상문', '수행평가', '교사의 서재', '도서관', '입시 웹툰']
const ACCEPT_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.hancom.hwpx': ['.hwpx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}
const MAX_SIZE = 20 * 1024 * 1024

type Content = {
  id: string
  title: string
  category: string | null
  excerpt: string | null
  body: string | null
  tags: string[] | null
  status: string
  file_url: string | null
  file_name: string | null
  cover_image_url: string | null
  resubmit_count: number
}

type UploadFile = {
  file: File
  state: 'pending' | 'uploading' | 'done' | 'error'
  storagePath?: string
}

function parseTags(raw: string) {
  return raw.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
}

export default function EditForm({ content }: { content: Content }) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(content.title)
  const [category, setCategory] = useState(content.category ?? '')
  const [body, setBody] = useState(content.body ?? '')
  const [excerpt, setExcerpt] = useState(content.excerpt ?? '')
  const [tags, setTags] = useState((content.tags ?? []).join(', '))
  const [newFile, setNewFile] = useState<UploadFile | null>(null)
  const [keepExisting, setKeepExisting] = useState(true)
  const [submitting, setSubmitting] = useState<'draft' | 'submitted' | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    if (rejected.length > 0) {
      setError(rejected[0].errors[0]?.message?.includes('size') ? '파일 크기는 최대 20MB입니다.' : '허용되지 않는 파일 형식입니다.')
      return
    }
    setError('')
    setNewFile({ file: accepted[0], state: 'pending' })
    setKeepExisting(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPT_TYPES, maxSize: MAX_SIZE, multiple: false,
  })

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function handleSubmit(status: 'draft' | 'submitted') {
    setError('')
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    if (!category) { setError('카테고리를 선택해주세요.'); return }
    const hasFile = (keepExisting && !!content.file_name) || !!newFile
    if (status === 'submitted' && !body.trim() && !hasFile) {
      setError('본문을 작성하거나 파일을 첨부해주세요.')
      return
    }

    setSubmitting(status)

    try {
      let file_url = keepExisting ? content.file_url : null
      let file_name = keepExisting ? content.file_name : null

      if (newFile) {
        const ext = newFile.file.name.split('.').pop()
        const path = `${content.id}/${Date.now()}.${ext}`
        setNewFile((f) => f ? { ...f, state: 'uploading' } : f)

        const { error: upErr } = await supabase.storage
          .from('uploads')
          .upload(path, newFile.file, { upsert: true })

        if (upErr) throw new Error('파일 업로드 실패: ' + upErr.message)
        file_url = supabase.storage.from('uploads').getPublicUrl(path).data.publicUrl
        file_name = newFile.file.name
        setNewFile((f) => f ? { ...f, state: 'done', storagePath: path } : f)
      }

      const tagArray = parseTags(tags)

      // 재제출인 경우 resubmit_count 증가
      const isResubmit = status === 'submitted' && content.status === 'revision'

      const { error: updateErr } = await supabase
        .from('contents')
        .update({
          title: title.trim(),
          category,
          body: body.trim() || null,
          excerpt: excerpt.trim() || null,
          tags: tagArray.length > 0 ? tagArray : null,
          status,
          file_url,
          file_name,
          ...(isResubmit ? { resubmit_count: content.resubmit_count + 1 } : {}),
        })
        .eq('id', content.id)

      if (updateErr) throw new Error('저장 실패: ' + updateErr.message)
      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
      setNewFile((f) => f ? { ...f, state: 'error' } : f)
    } finally {
      setSubmitting(null)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-[#012d1d]">저장 완료!</h2>
        <p className="text-sm text-[#012d1d]/60">마이페이지에서 확인할 수 있습니다.</p>
        <button
          onClick={() => router.push('/mypage')}
          className="px-5 py-2.5 rounded-lg bg-[#012d1d] text-[#fdf9ee] text-sm font-medium hover:bg-[#011f16] transition-colors"
        >
          마이페이지로
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-semibold text-[#012d1d] mb-1.5">
          제목 <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[#012d1d]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20 text-sm"
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label className="block text-sm font-semibold text-[#012d1d] mb-1.5">
          카테고리 <span className="text-rose-400">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[#012d1d]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20 text-sm text-[#012d1d]"
        >
          <option value="">카테고리 선택</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* 본문 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-[#012d1d]">본문</label>
          <span className="text-xs text-[#012d1d]/30">{body.length.toLocaleString()}자</span>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          placeholder="글을 직접 작성하세요."
          className="w-full px-4 py-3 rounded-lg border border-[#012d1d]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20 text-sm resize-y"
        />
      </div>

      {/* 내용 요약 */}
      <div>
        <label className="block text-sm font-semibold text-[#012d1d] mb-1.5">내용 요약 <span className="text-[#012d1d]/40 font-normal text-xs">(선택)</span></label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          placeholder="글의 핵심 내용을 간략하게 소개해 주세요"
          className="w-full px-4 py-3 rounded-lg border border-[#012d1d]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20 text-sm resize-none"
        />
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-semibold text-[#012d1d] mb-1.5">태그 <span className="text-[#012d1d]/40 font-normal text-xs">(선택)</span></label>
        <input
          type="text"
          placeholder="쉼표로 구분 (예: 환경, 독서, 사회)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[#012d1d]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20 text-sm"
        />
        {tags && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {parseTags(tags).map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-[#012d1d]/10 text-[#012d1d] text-xs font-medium">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* 파일 */}
      <div>
        <label className="block text-sm font-semibold text-[#012d1d] mb-1.5">파일 첨부 <span className="text-[#012d1d]/40 font-normal text-xs">(선택)</span></label>

        {content.file_name && keepExisting && !newFile && (
          <div className="flex items-center gap-3 px-4 py-3 bg-[#fdf9ee] rounded-lg border border-[#012d1d]/15 mb-3">
            <Paperclip size={15} className="text-[#012d1d]/40 shrink-0" />
            <p className="text-sm text-[#012d1d]/70 flex-1 truncate">{content.file_name} <span className="text-[#012d1d]/30">(기존 파일)</span></p>
            <button type="button" onClick={() => setKeepExisting(false)} className="text-[#012d1d]/30 hover:text-rose-400 transition-colors">
              <X size={15} />
            </button>
          </div>
        )}

        {(!content.file_name || !keepExisting) && !newFile && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-[#775a19] bg-[#775a19]/5' : 'border-[#012d1d]/20 bg-[#fdf9ee]/50 hover:border-[#012d1d]/40'
            }`}
          >
            <input {...getInputProps()} />
            <Upload size={24} className="mx-auto text-[#012d1d]/30 mb-2" />
            <p className="text-sm text-[#012d1d]/60">
              {isDragActive ? '파일을 여기에 놓으세요' : '클릭하거나 파일을 드래그해 주세요'}
            </p>
            <p className="text-xs text-[#012d1d]/30 mt-1">PDF, HWPX, DOCX · 최대 20MB</p>
          </div>
        )}

        {newFile && (
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-[#012d1d]/10">
            <FileText size={16} className="shrink-0 text-[#012d1d]/40" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#012d1d] truncate">{newFile.file.name}</p>
              <p className="text-xs text-[#012d1d]/40">{formatSize(newFile.file.size)}</p>
            </div>
            {newFile.state !== 'uploading' && (
              <button type="button" onClick={() => { setNewFile(null); setKeepExisting(!!content.file_name) }} className="shrink-0 text-[#012d1d]/30 hover:text-rose-400 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-rose-500 text-sm">{error}</p>}

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={!!submitting}
          className="flex items-center gap-2 px-5 py-3 rounded-lg border border-[#012d1d]/20 text-[#012d1d]/70 text-sm font-medium hover:border-[#012d1d]/40 transition-colors disabled:opacity-50"
        >
          {submitting === 'draft' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          임시 저장
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('submitted')}
          disabled={!!submitting}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[#012d1d] text-[#fdf9ee] text-sm font-semibold hover:bg-[#011f16] transition-colors disabled:opacity-50"
        >
          {submitting === 'submitted' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {content.status === 'revision' ? '수정 완료 · 재제출' : '제출하기'}
        </button>
      </div>
    </form>
  )
}
