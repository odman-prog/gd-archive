export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 w-48 bg-[#012d1d]/10 rounded-lg mb-2" />
      <div className="h-4 w-32 bg-[#012d1d]/8 rounded mb-8" />
      <div className="flex gap-2 mb-6">
        <div className="h-10 w-36 bg-[#012d1d]/10 rounded-lg" />
        <div className="h-10 w-36 bg-[#012d1d]/8 rounded-lg" />
      </div>
      <div className="rounded-xl border border-[#012d1d]/10 overflow-hidden">
        <div className="h-10 bg-[#fdf9ee]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 border-t border-[#012d1d]/5 px-5 flex items-center gap-4">
            <div className="flex-1 h-4 bg-[#012d1d]/8 rounded" />
            <div className="h-4 w-16 bg-[#012d1d]/8 rounded" />
            <div className="h-4 w-16 bg-[#012d1d]/8 rounded" />
            <div className="h-8 w-28 bg-[#012d1d]/8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
