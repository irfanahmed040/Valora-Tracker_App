'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { addDays, parseISO, isToday, format } from 'date-fns'

interface HeaderProps {
  date?: string
  title?: string
  showDateNav?: boolean
}

export function Header({ date, title, showDateNav = false }: HeaderProps) {
  const router = useRouter()

  function navigateDay(offset: number) {
    if (!date) return
    const newDate = addDays(parseISO(date), offset)
    router.push(`/day/${formatDate(newDate)}`)
  }

  const parsedDate = date ? parseISO(date) : null
  const isTodayDate = parsedDate ? isToday(parsedDate) : false

  return (
    <header className="flex items-center justify-center px-4 py-3 border-b bg-background md:sticky md:top-0 z-30 md:ml-60 relative">
      {showDateNav && date && parsedDate ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 md:left-4"
            onClick={() => navigateDay(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex flex-col items-center gap-0.5">
            {isTodayDate ? (
              <>
                <span className="text-base font-bold leading-tight">Today</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {format(parsedDate, 'EEEE, dd/MM/yyyy')}
                </span>
              </>
            ) : (
              <>
                <span className="text-base font-bold leading-tight">
                  {format(parsedDate, 'EEEE')}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {format(parsedDate, 'dd/MM/yyyy')}
                </span>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 md:right-4"
            onClick={() => navigateDay(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <h1 className="text-sm font-semibold">{title}</h1>
      )}
    </header>
  )
}
