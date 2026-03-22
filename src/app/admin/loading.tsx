export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 w-36 bg-[#012d1d]/10 rounded-lg mb-2" />
      <div className="h-4 w-24 bg-[#012d1d]/8 rounded mb-8" />
      <div className="grid grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-[#012d1d]/10" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-white rounded-xl border border-[#012d1d]/10" />
        ))}
      </div>
    </div>
  )
}
