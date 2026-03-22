export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-4 w-20 bg-[#012d1d]/8 rounded mb-8" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-[#012d1d]/10 rounded-full" />
      </div>
      <div className="h-10 bg-[#012d1d]/10 rounded-lg mb-2" />
      <div className="h-8 w-3/4 bg-[#012d1d]/8 rounded-lg mb-8" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-full bg-[#012d1d]/10" />
        <div className="flex flex-col gap-1">
          <div className="h-4 w-24 bg-[#012d1d]/10 rounded" />
          <div className="h-3 w-20 bg-[#012d1d]/8 rounded" />
        </div>
      </div>
      <div className="border-t border-[#012d1d]/10 mb-8" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-[#012d1d]/8 rounded" style={{ width: `${75 + Math.random() * 25}%` }} />
        ))}
      </div>
    </div>
  )
}
