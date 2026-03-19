'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, FileText, CheckCircle2, Loader2, Save, Send } from 'lucide-react'

const CATEGORIES = ['기사', '에세이', '인터뷰', '시/수필', '독서감상문', '수행평가']

const ACCEPT_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.hancom.hwpx': ['.hwpx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

const MAX_SIZE = 20 * 1024 * 1024 // 20MB

type UploadFile = {
  file: File
  state: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  storagePath?: string
}

type Status = 'submitted' | 'draft'

export default function WriteForm({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [summary, setSummary] = useState('')
  const [tags, setTags] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState<Status | null>(null)
  const [done, setDone] = useState<Status | null>(null)
  const [error, setError] = useState('')

  // ── Dropzone ─────────────────────────────────────
  const onDrop = useCallback((accepted: File[], rejected: { file: File; errors: { message: string }[] }[]) => {
    if (rejected.length > 0) {
      const msg = rejected[0].errors[0]?.message ?? '파일 오류'
      setError(msg.includes('size') ? '파일 크기는 최대 20MB입니다.' : '허용되지 않는 파일 형식입니다.')
      return
    }
    setError('')
    setFiles((prev) => [
      ...prev,
      ...accepted.map((f) => ({ file: f, state: 'pending' as const, progress: 0 })),
    ])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
  })

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ── 파일 업로드 ───────────────────────────────────
  async function uploadFiles(): Promise<UploadFile[]> {
    const results: UploadFile[] = [...files]
    for (let i = 0; i < results.length; i++) {
      const item = results[i]
      if (item.state === 'done') continue
      results[i] = { ...item, state: 'uploading', progress: 30 }
      setFiles([...results])

      const ext = item.file.name.split('.').pop()
      const path = `${userId}/${Date.now()}_${i}.${ext}`

      const { error } = await supabase.storage
        .from('uploads')
        .upload(path, item.file, { upsert: false })

      if (error) {
        results[i] = { ...results[i], state: 'error', progress: 0 }
        setFiles([...results])
        throw new Error(`파일 업로드 실패: ${item.file.name}`)
      }

      results[i] = { ...results[i], state: 'done', progress: 100, storagePath: path }
      setFiles([...results])
    }
    return results
  }

  // ── 제출 ─────────────────────────────────────────
  async function handleSubmit(status: Status) {
    setError('')
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    if (!category) { setError('카테고리를 선택해주세요.'); return }

    setSubmitting(status)

    try {
      // 1. 파일 업로드
      const uploadedFiles = files.length > 0 ? await uploadFiles() : []
      const failedFile = uploadedFiles.find((f) => f.state === 'error')
      if (failedFile) throw new Error(`파일 업로드 실패: ${failedFile.file.name}`)

      // 2. contents 테이블 저장
      const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean)
      const { data: content, error: contentError } = await supabase
        .from('contents')
        .insert({
          author_id: userId,
          title: title.trim(),
          category,
          summary: summary.trim() || null,
          tags: tagArray.length > 0 ? tagArray : null,
          status,
        })
        .select('id')
        .single()

      if (contentError || !content) throw new Error('글 저장에 실패했습니다.')

      // 3. attachments 테이블 저장
      if (uploadedFiles.length > 0) {
        const attRows = uploadedFiles
          .filter((f) => f.storagePath)
          .map((f) => ({
            content_id: content.id,
            file_name: f.file.name,
            storage_path: f.storagePath!,
            file_size: f.file.size,
          }))
        await supabase.from('attachments').insert(attRows)
      }

      setDone(status)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setSubmitting(null)
    }
  }

  // ── 완료 화면 ─────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-[#1B4332]">
          {done === 'submitted' ? '제출 완료!' : '임시 저장 완료!'}
        </h2>
        <p className="text-sm text-[#1B4332]/60 leading-relaxed">
          {done === 'submitted'
            ? '편집부 검토 후 게시됩니다.\n검토는 영업일 기준 1~3일 소요될 수 있습니다.'
            : '임시 저장된 글은 마이페이지에서 수정할 수 있습니다.'}
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => { setDone(null); setTitle(''); setCategory(''); setSummary(''); setTags(''); setFiles([]) }}
            className="px-5 py-2.5 rounded-lg border border-[#1B4332]/20 text-[#1B4332]/60 text-sm hover:border-[#1B4332]/40 transition-colors"
          >
            새 글 쓰기
          </button>
          <button
            onClick={() => router.push('/archive')}
            className="px-5 py-2.5 rounded-lg bg-[#1B4332] text-[#FEFAE0] text-sm font-medium hover:bg-[#163728] transition-colors"
          >
            아카이브 보기
          </button>
        </div>
      </div>
    )
  }

  // ── 메인 폼 ──────────────────────────────────────
  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">

      {/* 제목 */}
      <div>
        <label className="block text-sm font-semibold text-[#1B4332] mb-1.5">
          제목 <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          placeholder="글 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[#1B4332]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 text-sm"
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label className="block text-sm font-semibold text-[#1B4332] mb-1.5">
          카테고리 <span className="text-rose-400">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[#1B4332]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 text-sm text-[#1B4332]"
        >
          <option value="">카테고리 선택</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* 내용 요약 */}
      <div>
        <label className="block text-sm font-semibold text-[#1B4332] mb-1.5">내용 요약</label>
        <textarea
          placeholder="글의 핵심 내용을 간략하게 소개해 주세요"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-[#1B4332]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 text-sm resize-none"
        />
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-semibold text-[#1B4332] mb-1.5">태그</label>
        <input
          type="text"
          placeholder="쉼표로 구분 (예: 환경, 독서, 사회)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[#1B4332]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 text-sm"
        />
        {tags && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full bg-[#1B4332]/10 text-[#1B4332] text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 파일 업로드 */}
      <div>
        <label className="block text-sm font-semibold text-[#1B4332] mb-1.5">파일 첨부</label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-[#D4A373] bg-[#D4A373]/5'
              : 'border-[#1B4332]/20 bg-[#FEFAE0]/50 hover:border-[#1B4332]/40 hover:bg-[#1B4332]/5'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={24} className="mx-auto text-[#1B4332]/30 mb-2" />
          <p className="text-sm text-[#1B4332]/60">
            {isDragActive ? '파일을 여기에 놓으세요' : '클릭하거나 파일을 드래그해 주세요'}
          </p>
          <p className="text-xs text-[#1B4332]/30 mt-1">PDF, HWPX, DOCX, JPG, PNG · 최대 20MB</p>
        </div>

        {/* 파일 목록 */}
        {files.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {files.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-[#1B4332]/10">
                <FileText size={16} className="shrink-0 text-[#1B4332]/40" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1B4332] truncate">{item.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#1B4332]/40">{formatSize(item.file.size)}</span>
                    {item.state === 'uploading' && (
                      <>
                        <div className="flex-1 h-1.5 bg-[#1B4332]/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#D4A373] rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#1B4332]/40">업로드 중...</span>
                      </>
                    )}
                    {item.state === 'done' && <span className="text-xs text-emerald-600 font-medium">완료</span>}
                    {item.state === 'error' && <span className="text-xs text-rose-500 font-medium">실패</span>}
                  </div>
                </div>
                {item.state !== 'uploading' && (
                  <button type="button" onClick={() => removeFile(idx)} className="shrink-0 text-[#1B4332]/30 hover:text-rose-400 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 에러 */}
      {error && <p className="text-rose-500 text-sm">{error}</p>}

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={!!submitting}
          className="flex items-center gap-2 px-5 py-3 rounded-lg border border-[#1B4332]/20 text-[#1B4332]/70 text-sm font-medium hover:border-[#1B4332]/40 transition-colors disabled:opacity-50"
        >
          {submitting === 'draft' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          임시 저장
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('submitted')}
          disabled={!!submitting}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[#1B4332] text-[#FEFAE0] text-sm font-semibold hover:bg-[#163728] transition-colors disabled:opacity-50"
        >
          {submitting === 'submitted' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          제출하기
        </button>
      </div>
    </form>
  )
}
