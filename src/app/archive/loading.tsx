export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-[540px] bg-primary/10" />
      <div className="max-w-screen-2xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 bg-primary/5 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
