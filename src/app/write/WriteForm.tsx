'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone, FileRejection } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, FileText, CheckCircle2, Loader2, Save, Send } from 'lucide-react'

const CATEGORIES = ['기사', '에세이', '인터뷰', '시/수필', '독서감상문', '수행평가', '교사의 서재', '도서관']

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  '기사':       '학교생활, 사회 이슈 등을 취재·보도하는 글',
  '에세이':     '개인의 경험이나 생각을 자유롭게 서술하는 글',
  '인터뷰':     '사람·단체를 만나 나눈 대화를 정리한 글',
  '시/수필':    '시, 수필, 단상 등 문학적 형식의 글',
  '독서감상문': '책을 읽고 느낀 점을 정리한 글',
  '수행평가':   '수업 과제로 제출하는 글 (성적 반영 여부 별도 확인)',
  '교사의 서재': '교사가 학생들에게 추천하는 도서 감상 및 사유를 담은 글',
  '도서관':     '학교 도서관과 관련된 소식, 추천 도서, 독서 활동 등을 담은 글',
}

const ACCEPT_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.hancom.hwpx': ['.hwpx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

const MAX_SIZE = 20 * 1024 * 1024

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
  const [body, setBody] = useState('')
  const [summary, setSummary] = useState('')
  const [tags, setTags] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState<Status | null>(null)
  const [done, setDone] = useState<Status | null>(null)
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
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

  function parseTags(raw: string) {
    return raw.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
  }

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

  async function handleSubmit(status: Status) {
    setError('')
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    if (!category) { setError('카테고리를 선택해주세요.'); return }
    if (status === 'submitted' && !body.trim() && files.length === 0) {
      setError('본문을 작성하거나 파일을 첨부해주세요.')
      return
    }

    setSubmitting(status)

    try {
      const uploadedFiles = files.length > 0 ? await uploadFiles() : []
      const failedFile = uploadedFiles.find((f) => f.state === 'error')
      if (failedFile) throw new Error(`파일 업로드 실패: ${failedFile.file.name}`)

      const tagArray = parseTags(tags)
      const firstFile = uploadedFiles.find((f) => f.storagePath)
      const { data: content, error: contentError } = await supabase
        .from('contents')
        .insert({
          author_id: userId,
          title: title.trim(),
          category,
          body: body.trim() || null,
          excerpt: summary.trim() || null,
          tags: tagArray.length > 0 ? tagArray : null,
          status,
          cover_image_url: null,
          file_url: firstFile?.storagePath ? supabase.storage.from('uploads').getPublicUrl(firstFile.storagePath).data.publicUrl : null,
          file_name: firstFile?.file.name ?? null,
        })
        .select('id')
        .single()

      if (contentError || !content) throw new Error('글 저장에 실패했습니다: ' + (contentError?.message ?? '알 수 없는 오류'))

      setDone(status)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setSubmitting(null)
    }
  }

  // ── 완료 화면 ──────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-primary mb-2">
            {done === 'submitted' ? '제출 완료' : '임시 저장 완료'}
          </h2>
          <p className="font-sans text-sm text-primary/45 leading-relaxed">
            {done === 'submitted'
              ? '편집부 검토 후 게시됩니다. 검토는 영업일 기준 1~3일 소요됩니다.'
              : '임시 저장된 글은 마이페이지에서 수정할 수 있습니다.'}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center mt-2">
          <button
            onClick={() => { setDone(null); setTitle(''); setCategory(''); setBody(''); setSummary(''); setTags(''); setFiles([]) }}
            className="px-6 py-2.5 rounded-full border border-primary/15 text-primary/55 text-sm font-sans hover:border-primary/30 transition-colors"
          >
            새 글 쓰기
          </button>
          <button
            onClick={() => router.push('/mypage')}
            className="px-6 py-2.5 rounded-full border border-secondary/30 text-secondary text-sm font-sans font-medium hover:bg-secondary/5 transition-colors"
          >
            내 글 확인
          </button>
          <button
            onClick={() => router.push('/archive')}
            className="px-6 py-2.5 rounded-full bg-primary text-cream text-sm font-sans font-medium hover:bg-primary/90 transition-colors"
          >
            아카이브 보기
          </button>
        </div>
      </div>
    )
  }

  // ── 메인 폼 ────────────────────────────────────────
  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-10">

      {/* 제목 */}
      <div className="border-b border-primary/10 pb-1">
        <label className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-primary/40 block mb-3">
          제목 <span className="text-secondary/70">*</span>
        </label>
        <input
          type="text"
          placeholder="글 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent font-serif text-2xl text-primary placeholder:text-primary/20 focus:outline-none"
        />
      </div>

      {/* 카테고리 — 필 버튼 */}
      <div>
        <label className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-primary/40 block mb-3">
          카테고리 <span className="text-secondary/70">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-xs font-sans font-semibold tracking-wide transition-all ${
                category === c
                  ? 'bg-primary text-cream shadow-sm'
                  : 'bg-primary/5 text-primary/45 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {category && CATEGORY_DESCRIPTIONS[category] && (
          <p className="mt-2.5 font-sans text-[11px] text-primary/30 pl-1">{CATEGORY_DESCRIPTIONS[category]}</p>
        )}
      </div>

      {/* 본문 */}
      <div className="border-b border-primary/10 pb-1">
        <div className="flex items-center justify-between mb-3">
          <label className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-primary/40">본문</label>
          <span className="font-sans text-[10px] text-primary/20">{body.length.toLocaleString()}자</span>
        </div>
        <textarea
          placeholder="글을 직접 작성하세요. 파일 첨부 없이도 제출할 수 있습니다."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          className="w-full bg-transparent font-sans text-sm text-primary placeholder:text-primary/20 focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* 내용 요약 */}
      <div className="border-b border-primary/10 pb-1">
        <div className="flex items-center justify-between mb-3">
          <label className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-primary/40">요약</label>
          <span className="font-sans text-[10px] text-primary/25">선택</span>
        </div>
        <textarea
          placeholder="글의 핵심 내용을 간략하게 소개해 주세요"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className="w-full bg-transparent font-sans text-sm text-primary placeholder:text-primary/20 focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* 태그 */}
      <div className="border-b border-primary/10 pb-3">
        <div className="flex items-center justify-between mb-3">
          <label className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-primary/40">태그</label>
          <span className="font-sans text-[10px] text-primary/25">선택 · 쉼표로 구분</span>
        </div>
        <input
          type="text"
          placeholder="환경, 독서, 사회"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full bg-transparent font-sans text-sm text-primary placeholder:text-primary/20 focus:outline-none"
        />
        {tags && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {parseTags(tags).map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[11px] font-sans font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 파일 첨부 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-primary/40">파일 첨부</label>
          <span className="font-sans text-[10px] text-primary/25">선택 · 최대 20MB</span>
        </div>
        <div
          {...getRootProps()}
          className={`border border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-secondary/50 bg-secondary/5'
              : 'border-primary/12 bg-primary/[0.02] hover:border-primary/25 hover:bg-primary/[0.04]'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={20} className="mx-auto text-primary/20 mb-2.5" />
          <p className="font-sans text-xs text-primary/40">
            {isDragActive ? '파일을 놓으세요' : '드래그 또는 클릭하여 파일 추가'}
          </p>
          <p className="font-sans text-[10px] text-primary/20 mt-1">PDF · HWPX · DOCX</p>
        </div>

        {files.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {files.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-primary/3 rounded-xl border border-primary/8">
                <FileText size={14} className="shrink-0 text-primary/30" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs text-primary truncate">{item.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-sans text-[10px] text-primary/30">{formatSize(item.file.size)}</span>
                    {item.state === 'uploading' && (
                      <>
                        <div className="flex-1 h-1 bg-primary/10 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="font-sans text-[10px] text-primary/30">업로드 중</span>
                      </>
                    )}
                    {item.state === 'done' && <span className="font-sans text-[10px] text-emerald-500 font-semibold">완료</span>}
                    {item.state === 'error' && <span className="font-sans text-[10px] text-rose-500 font-semibold">실패</span>}
                  </div>
                </div>
                {item.state !== 'uploading' && (
                  <button type="button" onClick={() => removeFile(idx)} className="shrink-0 text-primary/20 hover:text-rose-400 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-100">
          <p className="font-sans text-xs text-rose-500">{error}</p>
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSubmit('draft')}
          disabled={!!submitting}
          className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-primary/12 text-primary/45 text-sm font-sans font-medium hover:border-primary/25 hover:text-primary/70 transition-all disabled:opacity-40"
        >
          {submitting === 'draft' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          임시 저장
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('submitted')}
          disabled={!!submitting}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-cream text-sm font-sans font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 shadow-sm shadow-primary/20"
        >
          {submitting === 'submitted' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          제출하기
        </button>
      </div>
    </form>
  )
}
