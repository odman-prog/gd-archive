import Link from 'next/link'
import { Eye, Heart } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export type Content = {
  id: string
  title: string
  summary: string | null
  category: string | null
  view_count: number
  like_count: number
  created_at: string
  profiles: { name: string; grade?: number | null; class_num?: number | null } | null
}

export const CATEGORY_COLORS: Record<string, string> = {
  '기사':       'bg-blue-100 text-blue-700',
  '에세이':     'bg-emerald-100 text-emerald-700',
  '인터뷰':     'bg-violet-100 text-violet-700',
  '시/수필':    'bg-pink-100 text-pink-700',
  '독서감상문': 'bg-amber-100 text-amber-700',
  '수행평가':   'bg-orange-100 text-orange-700',
  '기타':       'bg-gray-100 text-gray-600',
}

export default function ContentCard({ content }: { content: Content }) {
  const categoryColor = CATEGORY_COLORS[content.category ?? ''] ?? CATEGORY_COLORS['기타']
  const profile = content.profiles
  const authorMeta = profile
    ? [
        profile.name,
        profile.grade && profile.class_num ? `${profile.grade}-${profile.class_num}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '알 수 없음'

  const timeAgo = formatDistanceToNow(new Date(content.created_at), { addSuffix: true, locale: ko })

  return (
    <Link href={`/archive/${content.id}`}>
      <div className="bg-white rounded-xl border border-[#1B4332]/10 p-5 h-full flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 hover:border-[#D4A373]/40 transition-all group">
        <div className="flex items-start justify-between gap-2">
          {content.category ? (
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor}`}>
              {content.category}
            </span>
          ) : <span />}
          <span className="text-xs text-[#1B4332]/30 shrink-0">{timeAgo}</span>
        </div>

        <h3 className="font-bold text-[#1B4332] text-base leading-snug group-hover:text-[#D4A373] transition-colors line-clamp-2">
          {content.title}
        </h3>

        {content.summary && (
          <p className="text-sm text-[#1B4332]/60 leading-relaxed line-clamp-2 flex-1">
            {content.summary}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-[#1B4332]/40 mt-auto pt-3 border-t border-[#1B4332]/5">
          <span className="font-medium text-[#1B4332]/60 truncate max-w-[60%]">{authorMeta}</span>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1"><Eye size={12} />{content.view_count.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Heart size={12} />{content.like_count.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
