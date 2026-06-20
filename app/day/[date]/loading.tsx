import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-center gap-4">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {/* Progress bar + buttons */}
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        {/* Task cards */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border overflow-hidden">
            <Skeleton className="h-1.5 w-full rounded-none" />
            <div className="p-4 flex items-start gap-3">
              <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-2 pt-1">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
