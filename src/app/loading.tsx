export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col gap-8 animate-pulse">
      <div className="h-64 bg-[#012d1d]/10 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-[#012d1d]/8 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 bg-[#012d1d]/8 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
