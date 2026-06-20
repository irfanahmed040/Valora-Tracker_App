import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      <div className="h-14 border-b flex items-center justify-center">
        <Skeleton className="h-5 w-28" />
      </div>

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
        {/* Controls row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>

        {/* Grid */}
        <Skeleton className="h-64 w-full rounded-xl" />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>

        {/* Donuts */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 justify-items-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-28 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
