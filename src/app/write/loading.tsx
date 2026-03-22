export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-8 w-32 bg-[#012d1d]/10 rounded-lg mb-8" />
      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-4 w-20 bg-[#012d1d]/10 rounded" />
            <div className="h-12 bg-[#012d1d]/8 rounded-lg" />
          </div>
        ))}
        <div className="h-36 bg-[#012d1d]/8 rounded-xl" />
      </div>
    </div>
  )
}
