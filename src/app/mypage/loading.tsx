export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
      {/* 프로필 카드 */}
      <div className="bg-white rounded-2xl border border-[#012d1d]/10 p-6 mb-8 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-[#012d1d]/10 shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-5 w-32 bg-[#012d1d]/10 rounded" />
          <div className="h-4 w-48 bg-[#012d1d]/8 rounded" />
        </div>
      </div>
      {/* 통계 */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-[#012d1d]/8 rounded-xl" />
        ))}
      </div>
      {/* 글 목록 */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-[#012d1d]/10" />
        ))}
      </div>
    </div>
  )
}
