import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div>
      <div className="h-14 border-b flex items-center justify-center">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
