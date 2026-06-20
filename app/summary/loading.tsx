import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      <div className="h-14 border-b flex items-center justify-center">
        <Skeleton className="h-5 w-28" />
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>

        <Skeleton className="h-32 w-full rounded-xl" />

        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
