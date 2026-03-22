'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Calendar, Download, Plus, X, Loader2, Upload, Trash2 } from 'lucide-react'

type Magazine = {
  id: string
  title: string
  issue_number: number
  theme: string | null
  publish_date: string | null
  cover_url: string | null
  pdf_url: string | null
}

const supabase = createClient()

export default function MagazineClient({
  initialMagazines,
  canRegister,
}: {
  initialMagazines: Magazine[]
  canRegister: boolean
}) {
  const [magazines, setMagazines] = useState(initialMagazines)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', issue_number: '', theme: '', publish_date: '' })
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  async function handleDelete(mag: Magazine) {
    if (!confirm(`제${mag.issue_number}호 "${mag.title}"을(를) 삭제하시겠습니까?`)) return
    const { error } = await supabase.from('magazines').delete().eq('id', mag.id)
    if (error) { alert('삭제 실패: ' + error.message); return }
    setMagazines((m) => m.filter((x) => x.id !== mag.id))
  }

  async function uploadFile(file: File, bucket: string, path: string): Promise<string | null> {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) { alert('파일 업로드 실패: ' + error.message); return null }
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
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
      theme: form.theme || null,
      publish_date: form.publish_date,
      cover_url,
      pdf_url,
    }).select().single()

    setSubmitting(false)
    if (error) { alert('등록 실패: ' + error.message); return }

    setMagazines((m) => [data, ...m].sort((a, b) => b.issue_number - a.issue_number))
    setForm({ title: '', issue_number: '', theme: '', publish_date: '' })
    setCoverFile(null)
    setPdfFile(null)
    setShowForm(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#012d1d]">교지</h1>
          <p className="text-sm text-[#012d1d]/50 mt-1">광덕고등학교 교지편집부가 발행한 교지 모음</p>
        </div>
        {canRegister && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#012d1d] text-white text-sm font-medium hover:bg-[#011f16] transition-colors"
          >
            <Plus size={15} />
            교지 등록
          </button>
        )}
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-white rounded-xl border border-[#012d1d]/10 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#012d1d]">새 교지 등록</h3>
            <button type="button" onClick={() => setShowForm(false)}>
              <X size={18} className="text-[#012d1d]/40 hover:text-[#012d1d]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">호수 *</label>
              <input type="number" min="1" required value={form.issue_number}
                onChange={(e) => setForm({ ...form, issue_number: e.target.value })}
                placeholder="예) 15"
                className="w-full px-3 py-2 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">발행일 *</label>
              <input type="date" required value={form.publish_date}
                onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">제목 *</label>
              <input type="text" required value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="교지 제목"
                className="w-full px-3 py-2 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">테마</label>
            <input type="text" value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
              placeholder="예) 자연과 공존"
              className="w-full px-3 py-2 rounded-lg border border-[#012d1d]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#012d1d]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">표지 이미지</label>
              <input ref={coverRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => coverRef.current?.click()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#012d1d]/30 text-sm text-[#012d1d]/50 hover:border-[#012d1d]/60 transition-colors"
              >
                <Upload size={14} />
                {coverFile ? coverFile.name : '이미지 선택 (JPG, PNG)'}
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#012d1d]/60 mb-1">PDF 파일</label>
              <input ref={pdfRef} type="file" accept=".pdf" className="hidden"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => pdfRef.current?.click()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#012d1d]/30 text-sm text-[#012d1d]/50 hover:border-[#012d1d]/60 transition-colors"
              >
                <Upload size={14} />
                {pdfFile ? pdfFile.name : 'PDF 선택'}
              </button>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-[#012d1d]/20 text-sm text-[#012d1d]/60 hover:bg-[#fdf9ee] transition-colors"
            >취소</button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#012d1d] text-white text-sm font-medium hover:bg-[#011f16] disabled:opacity-50 transition-colors"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              등록
            </button>
          </div>
        </form>
      )}

      {/* 목록 */}
      {magazines.length === 0 ? (
        <div className="py-32 flex flex-col items-center gap-3 text-[#012d1d]/40">
          <BookOpen size={40} />
          <p className="text-sm">아직 등록된 교지가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {magazines.map((mag) => (
            <div key={mag.id}
              className="bg-white rounded-xl border border-[#012d1d]/10 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="h-52 bg-gradient-to-br from-[#012d1d] to-[#1a4432] flex items-center justify-center">
                {mag.cover_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={mag.cover_url} alt={mag.title} className="w-full h-full object-cover" />
                  : <div className="text-center text-[#fdf9ee]">
                      <BookOpen size={36} className="mx-auto mb-2 opacity-60" />
                      <p className="text-lg font-bold">제{mag.issue_number}호</p>
                    </div>
                }
              </div>
              <div className="p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-[#012d1d]/40">
                  <Calendar size={12} />
                  {mag.publish_date && <span>{mag.publish_date.slice(0, 7)}</span>}
                  <span>·</span>
                  <span>제{mag.issue_number}호</span>
                </div>
                <h2 className="font-bold text-[#012d1d] group-hover:text-[#775a19] transition-colors">{mag.title}</h2>
                {mag.theme && <p className="text-sm text-[#012d1d]/50 line-clamp-2">{mag.theme}</p>}
                {mag.pdf_url && (
                  <a href={mag.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 py-2 rounded-lg border border-[#012d1d]/20 text-sm text-[#012d1d]/60 hover:bg-[#012d1d] hover:text-[#fdf9ee] hover:border-[#012d1d] transition-colors"
                  >
                    <Download size={14} /> PDF 다운로드
                  </a>
                )}
                {canRegister && (
                  <button onClick={() => handleDelete(mag)}
                    className="mt-1 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-rose-200 text-sm text-rose-400 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={14} /> 삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
