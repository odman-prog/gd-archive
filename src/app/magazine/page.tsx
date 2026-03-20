import { createClient } from '@/lib/supabase/server'
import { BookOpen, Calendar, Download } from 'lucide-react'

type Magazine = {
  id: string
  title: string
  volume: number
  published_year: number
  description: string | null
  cover_url: string | null
  file_url: string | null
  created_at: string
}

export default async function MagazinePage() {
  const supabase = createClient()

  const { data: magazines } = await supabase
    .from('magazines')
    .select('*')
    .order('volume', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* 헤더 */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[#1B4332]">교지</h1>
        <p className="text-sm text-[#1B4332]/50 mt-1">광덕고등학교 교지편집부가 발행한 교지 모음</p>
      </div>

      {/* 목록 */}
      {!magazines || magazines.length === 0 ? (
        <div className="py-32 flex flex-col items-center gap-3 text-[#1B4332]/40">
          <BookOpen size={40} />
          <p className="text-sm">아직 등록된 교지가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {magazines.map((mag: Magazine) => (
            <div
              key={mag.id}
              className="bg-white rounded-xl border border-[#1B4332]/10 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              {/* 표지 영역 */}
              <div className="h-52 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] flex items-center justify-center relative">
                {mag.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mag.cover_url}
                    alt={mag.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-[#FEFAE0]">
                    <BookOpen size={36} className="mx-auto mb-2 opacity-60" />
                    <p className="text-lg font-bold">제{mag.volume}호</p>
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-[#1B4332]/40">
                  <Calendar size={12} />
                  <span>{mag.published_year}년</span>
                  <span>·</span>
                  <span>제{mag.volume}호</span>
                </div>
                <h2 className="font-bold text-[#1B4332] group-hover:text-[#D4A373] transition-colors">
                  {mag.title}
                </h2>
                {mag.description && (
                  <p className="text-sm text-[#1B4332]/50 line-clamp-2 leading-relaxed">
                    {mag.description}
                  </p>
                )}
                {mag.file_url && (
                  <a
                    href={mag.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 py-2 rounded-lg border border-[#1B4332]/20 text-sm text-[#1B4332]/60 hover:bg-[#1B4332] hover:text-[#FEFAE0] hover:border-[#1B4332] transition-colors"
                  >
                    <Download size={14} />
                    PDF 다운로드
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
