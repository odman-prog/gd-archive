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
  cover_image_url?: string | null
  profiles: { name: string; grade?: number | null; class?: number | null } | null
}

export const CATEGORY_COLORS: Record<string, string> = {
  '기사': 'bg-blue-100 text-blue-700',
  '에세이': 'bg-emerald-100 text-emerald-700',
  '인터뷰': 'bg-violet-100 text-violet-700',
  '시/수필': 'bg-pink-100 text-pink-700',
  '독서감상문': 'bg-amber-100 text-amber-700',
  '수행평가': 'bg-orange-100 text-orange-700',
  '교사의 서재': 'bg-yellow-100 text-yellow-700',
  '도서관': 'bg-teal-100 text-teal-700',
  '입시 웹툰': 'bg-purple-100 text-purple-700',
  '기타': 'bg-gray-100 text-gray-600',
}

export const CATEGORY_GRADIENTS: Record<string, string> = {
  '기사': 'from-slate-900 to-blue-900',
  '에세이': 'from-zinc-900 to-emerald-900',
  '인터뷰': 'from-[#1a1525] to-violet-900',
  '시/수필': 'from-[#2a1b22] to-pink-900',
  '독서감상문': 'from-[#2a2115] to-amber-900',
  '수행평가': 'from-[#2c1d11] to-orange-900',
  '교사의 서재': 'from-[#2a2100] to-yellow-900',
  '도서관': 'from-[#0d2020] to-teal-900',
  '입시 웹툰': 'from-[#1a0a2e] to-purple-900',
  '기타': 'from-zinc-900 to-zinc-800',
}

export default function ContentCard({ content }: { content: Content }) {
  const categoryColor = CATEGORY_COLORS[content.category ?? ''] ?? CATEGORY_COLORS['기타']
  const categoryGradient = CATEGORY_GRADIENTS[content.category ?? ''] ?? CATEGORY_GRADIENTS['기타']
  const profile = content.profiles
  const authorMeta = profile
    ? [
      profile.name,
      profile.grade && profile.class ? `${profile.grade}-${profile.class}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    : '알 수 없음'

  const timeAgo = formatDistanceToNow(new Date(content.created_at), { addSuffix: true, locale: ko })

  return (
    <Link href={`/archive/${content.id}`}>
      <div className="bg-white rounded-2xl border border-primary/8 overflow-hidden h-full flex flex-col hover:shadow-lg hover:-translate-y-0.5 hover:border-secondary/30 transition-all duration-300 group">
        {/* 썸네일 */}
        <div className="aspect-[16/10] overflow-hidden relative shrink-0">
          {content.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.cover_image_url}
              alt={content.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryGradient} flex items-end p-4`}>
              <span className="text-white/20 font-serif font-bold text-4xl leading-none line-clamp-2 tracking-tight">
                {content.title}
              </span>
            </div>
          )}
          {content.cover_image_url && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="p-5 flex flex-col gap-2.5 flex-1">
          <div className="flex items-start justify-between gap-2">
            {content.category ? (
              <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${categoryColor}`}>
                {content.category}
              </span>
            ) : <span />}
            <span className="text-xs text-primary/30 shrink-0">{timeAgo}</span>
          </div>

          <h3 className="font-serif font-bold text-primary text-base leading-snug group-hover:text-secondary transition-colors line-clamp-2">
            {content.title}
          </h3>

          {content.summary && (
            <p className="text-sm text-primary/50 leading-relaxed line-clamp-2 flex-1 font-sans">
              {content.summary}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-primary/40 mt-auto pt-3 border-t border-primary/5">
            <span className="font-medium text-primary/55 truncate max-w-[60%]">{authorMeta}</span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1"><Eye size={11} />{content.view_count.toLocaleString()}</span>
              <span className="flex items-center gap-1"><Heart size={11} />{content.like_count.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
