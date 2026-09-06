export default function SkeletonCard() {
  return (
    <div className="card p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="shimmer h-4 w-3/4 rounded" />
        <div className="shimmer h-6 w-6 rounded-lg" />
      </div>
      <div className="space-y-1.5">
        <div className="shimmer h-3 w-full rounded" />
        <div className="shimmer h-3 w-5/6 rounded" />
      </div>
      <div className="flex gap-1.5 mt-auto">
        <div className="shimmer h-4 w-12 rounded-full" />
        <div className="shimmer h-4 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`shimmer h-3 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`shimmer rounded-xl ${className}`} />
}
