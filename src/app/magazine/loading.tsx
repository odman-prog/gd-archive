export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 w-24 bg-[#012d1d]/10 rounded-lg mb-2" />
      <div className="h-4 w-48 bg-[#012d1d]/8 rounded mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#012d1d]/10 overflow-hidden">
            <div className="h-52 bg-[#012d1d]/10" />
            <div className="p-5 flex flex-col gap-2">
              <div className="h-3 w-24 bg-[#012d1d]/8 rounded" />
              <div className="h-5 w-36 bg-[#012d1d]/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
