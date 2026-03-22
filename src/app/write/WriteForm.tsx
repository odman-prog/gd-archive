'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone, FileRejection } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, FileText, CheckCircle2, Loader2, Save, Send, ImagePlus } from 'lucide-react'

const CATEGORIES = ['기사', '에세이', '인터뷰', '시/수필', '독서감상문', '수행평가']

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  '기사':       '학교생활, 사회 이슈 등을 취재·보도하는 글',
  '에세이':     '개인의 경험이나 생각을 자유롭게 서술하는 글',
  '인터뷰':     '사람·단체를 만나 나눈 대화를 정리한 글',
  '시/수필':    '시, 수필, 단상 등 문학적 형식의 글',
  '독서감상문': '책을 읽고 느낀 점을 정리한 글',
  '수행평가':   '수업 과제로 제출하는 글 (성적 반영 여부 별도 확인)',
}

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
  const [body, setBody] = useState('')
  const [summary, setSummary] = useState('')
  const [tags, setTags] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([])
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [submitting, setSubmitting] = useState<Status | null>(null)
  const [done, setDone] = useState<Status | null>(null)
  const [error, setError] = useState('')

  // ── Dropzone ─────────────────────────────────────
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

  // ── 태그 파싱 (# 자동 제거) ───────────────────────
  function parseTags(raw: string) {
    return raw.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
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

  // ── 커버 이미지 선택 ──────────────────────────────
  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('이미지 파일만 선택 가능합니다.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('커버 이미지는 최대 10MB입니다.'); return }
    setCoverImage(file)
    setCoverPreview(URL.createObjectURL(file))
    setError('')
  }

  function removeCover() {
    setCoverImage(null)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview('')
  }

  // ── 제출 ─────────────────────────────────────────
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
      // 커버 이미지 업로드
      let cover_image_url: string | null = null
      if (coverImage) {
        const ext = coverImage.name.split('.').pop()
        const coverPath = `covers/${userId}/${Date.now()}.${ext}`
        const { error: coverErr } = await supabase.storage.from('uploads').upload(coverPath, coverImage, { upsert: false })
        if (coverErr) throw new Error('커버 이미지 업로드 실패: ' + coverErr.message)
        cover_image_url = supabase.storage.from('uploads').getPublicUrl(coverPath).data.publicUrl
      }

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
          cover_image_url,
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

  // ── 완료 화면 ─────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-[#012d1d]">
          {done === 'submitted' ? '제출 완료!' : '임시 저장 완료!'}
        </h2>
        <p className="text-sm text-[#012d1d]/60 leading-relaxed">
          {done === 'submitted'
            ? '편집부 검토 후 게시됩니다.\n검토는 영업일 기준 1~3일 소요될 수 있습니다.'
            : '임시 저장된 글은 마이페이지에서 수정할 수 있습니다.'}
        </p>
        <div className="flex gap-3 mt-2 flex-wrap justify-center">
          <button
            onClick={() => { setDone(null); setTitle(''); setCategory(''); setBody(''); setSummary(''); setTags(''); setFiles([]); removeCover() }}
            className="px-5 py-2.5 rounded-lg border border-[#012d1d]/20 text-[#012d1d]/60 text-sm hover:border-[#012d1d]/40 transition-colors"
          >
            새 글 쓰기
          </button>
          <button
            onClick={() => router.push('/mypage')}
            className="px-5 py-2.5 rounded-lg border border-[#775a19] text-[#775a19] text-sm font-medium hover:bg-[#775a19]/10 transition-colors"
          >
            내 글 확인
          </button>
          <button
            onClick={() => router.push('/archive')}
            className="px-5 py-2.5 rounded-lg bg-[#012d1d] text-[#fdf9ee] text-sm font-medium hover:bg-[#011f16] transition-colors"
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

      {/* 커버 이미지 */}
      <div>
        <label className="block text-sm font-semibold text-[#012d1d] mb-1.5">
          커버 이미지 <span className="text-[#012d1d]/40 font-normal text-xs">(선택 · 아카이브 카드에 표시)</span>
        </label>
        {coverPreview ? (
          <div className="relative rounded-xl overflow-hidden border border-[#012d1d]/10 aspect-[16/7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPreview} alt="커버 미리보기" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={removeCover}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 aspect-[16/7] border-2 border-dashed border-[#012d1d]/20 rounded-xl cursor-pointer hover:border-[#012d1d]/40 hover:bg-[#012d1d]/3 transition-colors bg-[#fdf9ee]/50">
            <ImagePlus size={24} className="text-[#012d1d]/25" />
            <span className="text-sm text-[#012d1d]/40">클릭하여 이미지 선택</span>
            <span className="text-xs text-[#012d1d]/25">JPG, PNG, WEBP · 최대 10MB</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </label>
        )}
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-sm font-semibold text-[#012d1d] mb-1.5">
          제목 <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          placeholder="글 제목을 입력하세요"
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
        {category && CATEGORY_DESCRIPTIONS[category] && (
          <p className="mt-1.5 text-xs text-[#012d1d]/40">{CATEGORY_DESCRIPTIONS[category]}</p>
        )}
      </div>

      {/* 본문 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-[#012d1d]">본문</label>
          <span className="text-xs text-[#012d1d]/30">{body.length.toLocaleString()}자</span>
        </div>
        <textarea
          placeholder="글을 직접 작성하세요. 파일 첨부 없이도 제출할 수 있습니다."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 rounded-lg border border-[#012d1d]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20 text-sm resize-y"
        />
      </div>

      {/* 내용 요약 */}
      <div>
        <label className="block text-sm font-semibold text-[#012d1d] mb-1.5">내용 요약 <span className="text-[#012d1d]/40 font-normal text-xs">(선택)</span></label>
        <textarea
          placeholder="글의 핵심 내용을 간략하게 소개해 주세요"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
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
              <span key={tag} className="px-2.5 py-1 rounded-full bg-[#012d1d]/10 text-[#012d1d] text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 파일 업로드 */}
      <div>
        <label className="block text-sm font-semibold text-[#012d1d] mb-1.5">파일 첨부 <span className="text-[#012d1d]/40 font-normal text-xs">(선택)</span></label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-[#775a19] bg-[#775a19]/5'
              : 'border-[#012d1d]/20 bg-[#fdf9ee]/50 hover:border-[#012d1d]/40 hover:bg-[#012d1d]/5'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={24} className="mx-auto text-[#012d1d]/30 mb-2" />
          <p className="text-sm text-[#012d1d]/60">
            {isDragActive ? '파일을 여기에 놓으세요' : '클릭하거나 파일을 드래그해 주세요'}
          </p>
          <p className="text-xs text-[#012d1d]/30 mt-1">PDF, HWPX, DOCX, JPG, PNG · 최대 20MB</p>
        </div>

        {files.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {files.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-[#012d1d]/10">
                <FileText size={16} className="shrink-0 text-[#012d1d]/40" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#012d1d] truncate">{item.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#012d1d]/40">{formatSize(item.file.size)}</span>
                    {item.state === 'uploading' && (
                      <>
                        <div className="flex-1 h-1.5 bg-[#012d1d]/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#775a19] rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="text-xs text-[#012d1d]/40">업로드 중...</span>
                      </>
                    )}
                    {item.state === 'done' && <span className="text-xs text-emerald-600 font-medium">완료</span>}
                    {item.state === 'error' && <span className="text-xs text-rose-500 font-medium">실패</span>}
                  </div>
                </div>
                {item.state !== 'uploading' && (
                  <button type="button" onClick={() => removeFile(idx)} className="shrink-0 text-[#012d1d]/30 hover:text-rose-400 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
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
          제출하기
        </button>
      </div>
    </form>
  )
}
