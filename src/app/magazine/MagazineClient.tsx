'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, Plus, X, Loader2, Upload, Trash2 } from 'lucide-react'

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
    setCoverFile(null); setPdfFile(null); setShowForm(false)
  }

  const featured = magazines[0] ?? null
  const rest = magazines.slice(1)

  return (
    <div className="bg-surface">

      {/* ── 히어로 ─────────────────────────────────── */}
      <section className="max-w-screen-2xl mx-auto px-8 md:px-12 pt-16 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-sans text-xs tracking-[0.2em] uppercase text-secondary font-bold mb-4 block">
              광덕고등학교 교지편집부
            </span>
            <h1 className="font-serif text-6xl md:text-8xl text-primary font-bold leading-[0.9] tracking-tighter mb-8 italic">
              교지<br />아카이브
            </h1>
            <p className="font-sans text-lg text-on-surface-variant max-w-lg leading-relaxed mb-8">
              광덕고등학교 교지편집부가 발행한 교지 모음입니다. 각 호를 클릭하면 PDF를 다운로드할 수 있습니다.
            </p>
            {canRegister && (
              <button
                onClick={() => setShowForm((v) => !v)}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-cream text-sm font-bold hover:bg-primary/90 transition-colors font-sans"
              >
                <Plus size={15} />
                교지 등록
              </button>
            )}
          </div>

          {/* 우측 이미지 */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-surface-container-low rounded-2xl -rotate-2 z-0" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-document.png"
              alt="교지 아카이브"
              className="relative z-10 w-full aspect-[4/5] object-cover rounded-xl shadow-lg group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* ── 등록 폼 ─────────────────────────────────── */}
      {showForm && (
        <div className="max-w-screen-2xl mx-auto px-8 md:px-12 mb-12">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-primary/10 p-8 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-primary">새 교지 등록</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X size={18} className="text-primary/40 hover:text-primary" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">호수 *</label>
                <input type="number" min="1" required value={form.issue_number}
                  onChange={(e) => setForm({ ...form, issue_number: e.target.value })}
                  placeholder="예) 15"
                  className="w-full px-4 py-3 rounded-lg border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">발행일 *</label>
                <input type="date" required value={form.publish_date}
                  onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">제목 *</label>
                <input type="text" required value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="교지 제목"
                  className="w-full px-4 py-3 rounded-lg border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">테마</label>
              <input type="text" value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value })}
                placeholder="예) 자연과 공존"
                className="w-full px-4 py-3 rounded-lg border border-primary/15 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-surface-container-low"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">표지 이미지</label>
                <input ref={coverRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => coverRef.current?.click()}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-primary/20 text-sm text-primary/50 hover:border-primary/40 transition-colors"
                >
                  <Upload size={14} />
                  {coverFile ? coverFile.name : '이미지 선택 (JPG, PNG)'}
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">PDF 파일</label>
                <input ref={pdfRef} type="file" accept=".pdf" className="hidden"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => pdfRef.current?.click()}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-primary/20 text-sm text-primary/50 hover:border-primary/40 transition-colors"
                >
                  <Upload size={14} />
                  {pdfFile ? pdfFile.name : 'PDF 선택'}
                </button>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-full border border-primary/20 text-sm text-primary/60 hover:bg-surface-container-low transition-colors"
              >취소</button>
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-cream text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                등록
              </button>
            </div>
          </form>
        </div>
      )}

      {magazines.length === 0 ? (
        <div className="py-40 flex flex-col items-center gap-4 text-primary/30">
          <span className="material-symbols-outlined text-[48px]">menu_book</span>
          <p className="text-sm font-sans">아직 등록된 교지가 없습니다.</p>
        </div>
      ) : (
        <>
          {/* ── 최신호 피처드 ──────────────────────────── */}
          {featured && (
            <section className="max-w-screen-2xl mx-auto px-8 md:px-12 mb-24">
              <div className="grid md:grid-cols-12 gap-0 items-stretch bg-surface-container-low rounded-2xl overflow-hidden shadow-sm">
                <div className="md:col-span-7 p-12 md:p-20 flex flex-col justify-center">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="h-px w-8 bg-secondary" />
                    <span className="font-sans text-xs text-secondary tracking-widest uppercase font-bold">
                      Latest Issue · 제{featured.issue_number}호
                    </span>
                  </div>
                  <h2 className="font-serif text-4xl md:text-5xl text-primary font-bold mb-4 leading-tight">
                    {featured.title}
                  </h2>
                  {featured.theme && (
                    <p className="font-sans text-lg text-on-surface-variant mb-3 leading-relaxed">
                      {featured.theme}
                    </p>
                  )}
                  {featured.publish_date && (
                    <p className="text-xs text-primary/40 font-sans uppercase tracking-widest mb-10">
                      {featured.publish_date.slice(0, 7)} 발행
                    </p>
                  )}
                  <div className="flex gap-3 flex-wrap">
                    {featured.pdf_url && (
                      <a
                        href={featured.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-cream rounded-full text-sm font-bold hover:bg-primary/90 transition-colors font-sans"
                      >
                        <Download size={14} />
                        PDF 다운로드
                      </a>
                    )}
                    {canRegister && (
                      <button
                        onClick={() => handleDelete(featured)}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-rose-200 text-sm text-rose-400 hover:bg-rose-50 transition-colors font-sans"
                      >
                        <Trash2 size={14} /> 삭제
                      </button>
                    )}
                  </div>
                </div>
                <div className="md:col-span-5 relative min-h-[360px]">
                  {featured.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.cover_url}
                      alt={featured.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/hero-archive.png"
                      alt="교지"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── 인용구 ──────────────────────────────────── */}
          <section className="max-w-screen-2xl mx-auto px-8 md:px-12 mb-24">
            <div className="py-20 bg-primary text-cream rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none select-none flex items-center justify-end pr-8">
                <span className="material-symbols-outlined" style={{ fontSize: '18rem', lineHeight: 1 }}>format_quote</span>
              </div>
              <div className="relative z-10 px-12 md:px-24 text-center max-w-4xl mx-auto">
                <span
                  className="material-symbols-outlined text-secondary text-[48px] mb-8 block"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >auto_stories</span>
                <blockquote className="font-serif text-3xl md:text-4xl italic leading-snug mb-8">
                  &ldquo;교육은 양동이를 채우는 것이 아니라 불을 지피는 것이다.&rdquo;
                </blockquote>
                <cite className="font-sans text-sm uppercase tracking-widest text-cream/50 not-italic">
                  William Butler Yeats
                </cite>
              </div>
            </div>
          </section>

          {/* ── 나머지 호 그리드 ─────────────────────────── */}
          {rest.length > 0 && (
            <section className="max-w-screen-2xl mx-auto px-8 md:px-12 mb-24">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <span className="text-secondary font-sans text-xs tracking-[0.3em] uppercase mb-2 block">Archive</span>
                  <h3 className="font-serif text-3xl text-primary font-bold">지난 호</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {rest.map((mag) => (
                  <div
                    key={mag.id}
                    className="bg-white rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all group border border-primary/5"
                  >
                    <div className="aspect-[3/4] bg-primary-container relative overflow-hidden">
                      {mag.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mag.cover_url} alt={mag.title} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/hero-logo.png" alt="광덕" className="w-full h-full object-cover opacity-30" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="font-serif text-4xl font-bold text-cream/80 italic">제{mag.issue_number}호</p>
                            <p className="font-sans text-xs text-cream/50 mt-2 tracking-widest uppercase">Gwangdeok</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="p-5 flex flex-col gap-2">
                      <span className="text-[10px] font-sans font-bold text-secondary uppercase tracking-widest">
                        제{mag.issue_number}호 {mag.publish_date && `· ${mag.publish_date.slice(0, 7)}`}
                      </span>
                      <h4 className="font-serif font-bold text-primary group-hover:text-secondary transition-colors leading-snug">
                        {mag.title}
                      </h4>
                      {mag.theme && (
                        <p className="text-xs text-on-surface-variant font-sans line-clamp-2">{mag.theme}</p>
                      )}
                      {mag.pdf_url && (
                        <a
                          href={mag.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center justify-center gap-2 py-2.5 rounded-full border border-primary/15 text-xs text-primary/60 hover:bg-primary hover:text-cream hover:border-primary transition-colors font-sans font-bold"
                        >
                          <Download size={12} /> PDF
                        </a>
                      )}
                      {canRegister && (
                        <button
                          onClick={() => handleDelete(mag)}
                          className="mt-1 w-full flex items-center justify-center gap-2 py-2 rounded-full border border-rose-100 text-xs text-rose-300 hover:bg-rose-50 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={12} /> 삭제
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
