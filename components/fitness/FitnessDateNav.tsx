'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { addDays, parseISO, isToday, format } from 'date-fns'

export function FitnessDateNav({ date }: { date: string }) {
  const router = useRouter()
  const parsed = parseISO(date)
  const today = isToday(parsed)

  function go(offset: number) {
    router.push(`/fitness?date=${formatDate(addDays(parsed, offset))}`)
  }

  return (
    <header className="flex items-center justify-center px-4 py-3 border-b bg-background md:sticky md:top-0 z-30 md:ml-60 relative">
      <Button variant="ghost" size="icon" className="absolute left-4 press-spring" onClick={() => go(-1)} aria-label="Previous day">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <button
        onClick={() => !today && router.push('/fitness')}
        className="flex flex-col items-center gap-0.5"
      >
        <span className="text-base font-bold leading-tight">
          {today ? 'Today' : format(parsed, 'EEEE')}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          {today ? format(parsed, 'EEEE, dd/MM/yyyy') : format(parsed, 'dd/MM/yyyy')}
        </span>
      </button>

      <Button variant="ghost" size="icon" className="absolute right-4 press-spring" onClick={() => go(1)} aria-label="Next day">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </header>
  )
}
