'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WeekCalendar } from '@/components/week/WeekCalendar'
import { MonthCalendar } from '@/components/month/MonthCalendar'
import { WeekStats } from '@/components/week/WeekStats'
import { PeriodMetrics } from '@/components/calendar/PeriodMetrics'
import { getWeekDays, getWeekRange, getMonthDays, getMonthRange, formatDate, cn } from '@/lib/utils'
import { addWeeks, subWeeks, addMonths, subMonths, parseISO, format } from 'date-fns'
import { BarChart3, ChevronLeft, ChevronRight, Loader2, X, Lock } from 'lucide-react'
import type { Target, DailyLog } from '@/lib/types'

interface Props {
  userId: string
  email: string
}

export function AdminUserAnalytics({ userId, email }: Props) {
  const [open, setOpen] = useState(false)
  const [isMonth, setIsMonth] = useState(false)
  const [anchor, setAnchor] = useState(() => new Date())
  const [targets, setTargets] = useState<Target[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(false)

  const days: string[] = isMonth
    ? getMonthDays(anchor).map(formatDate)
    : getWeekDays(anchor).map(formatDate)

  const rangeStart = isMonth ? getMonthRange(anchor).monthStart : getWeekRange(anchor).weekStart
  const rangeEnd = isMonth ? getMonthRange(anchor).monthEnd : getWeekRange(anchor).weekEnd

  const periodLabel = isMonth
    ? format(anchor, 'MMMM yyyy')
    : `${format(parseISO(rangeStart), 'dd/MM/yyyy')} – ${format(parseISO(rangeEnd), 'dd/MM/yyyy')}`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/user-data?userId=${userId}&start=${rangeStart}&end=${rangeEnd}`)
      if (!res.ok) throw new Error()
      const { targets, logs } = await res.json()
      setTargets(targets)
      setLogs(logs)
    } catch {
      setTargets([])
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [userId, rangeStart, rangeEnd])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <BarChart3 className="h-3.5 w-3.5" />
        Show analytics
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="max-w-3xl w-full max-h-[85vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-popover z-10 px-5 pt-5 pb-3 border-b">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <DialogTitle className="text-base truncate">Analytics — {email}</DialogTitle>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Lock className="h-3 w-3" /> Read-only view
                </p>
              </div>
              <DialogClose render={<Button variant="ghost" size="sm" className="gap-1 -mr-2" />}>
                <X className="h-4 w-4" />
                Back
              </DialogClose>
            </div>
          </DialogHeader>

          {/* Controls */}
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex rounded-lg border overflow-hidden shrink-0">
              <button
                onClick={() => setIsMonth(false)}
                className={cn('px-3 py-1 text-xs font-medium', !isMonth ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                Week
              </button>
              <button
                onClick={() => setIsMonth(true)}
                className={cn('px-3 py-1 text-xs font-medium border-l', isMonth ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                Month
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setAnchor(isMonth ? subMonths(anchor, 1) : subWeeks(anchor, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold min-w-[130px] text-center">{periodLabel}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setAnchor(isMonth ? addMonths(anchor, 1) : addWeeks(anchor, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Grid — pointer-events-none = no navigation/edits */}
              <div className="pointer-events-none select-none">
                {isMonth
                  ? <MonthCalendar days={days} targets={targets} logs={logs} />
                  : <WeekCalendar days={days} targets={targets} logs={logs} />}
              </div>
              <WeekStats targets={targets} logs={logs} days={days} />
              <PeriodMetrics targets={targets} logs={logs} days={days} isMonth={isMonth} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
