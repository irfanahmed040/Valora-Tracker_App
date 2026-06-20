import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { WeekCalendar } from '@/components/week/WeekCalendar'
import { MonthCalendar } from '@/components/month/MonthCalendar'
import { WeekStats } from '@/components/week/WeekStats'
import { PeriodMetrics } from '@/components/calendar/PeriodMetrics'
import { getWeekDays, getWeekRange, getMonthDays, getMonthRange, formatDate } from '@/lib/utils'
import { addWeeks, subWeeks, addMonths, subMonths, parseISO, format } from 'date-fns'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import type { Target, DailyLog } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ view?: string; date?: string }>
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const { view = 'week', date } = await searchParams
  const isMonth = view === 'month'
  const anchor = date ? parseISO(date) : new Date()

  const days: string[] = isMonth
    ? getMonthDays(anchor).map(formatDate)
    : getWeekDays(anchor).map(formatDate)

  const rangeStart = isMonth ? getMonthRange(anchor).monthStart : getWeekRange(anchor).weekStart
  const rangeEnd   = isMonth ? getMonthRange(anchor).monthEnd   : getWeekRange(anchor).weekEnd

  const prevAnchor = formatDate(isMonth ? subMonths(anchor, 1) : subWeeks(anchor, 1))
  const nextAnchor = formatDate(isMonth ? addMonths(anchor, 1) : addWeeks(anchor, 1))

  const periodLabel = isMonth
    ? format(anchor, 'MMMM yyyy')
    : `${format(parseISO(rangeStart), 'dd/MM/yyyy')} – ${format(parseISO(rangeEnd), 'dd/MM/yyyy')}`

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: targets }, { data: logs }] = await Promise.all([
    supabase.from('targets').select('*').eq('user_id', user.id).or('active.eq.true,deleted_at.not.is.null').order('created_at'),
    supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('date', rangeStart).lte('date', rangeEnd),
  ])

  const typedTargets = (targets ?? []) as Target[]
  const typedLogs    = (logs ?? []) as DailyLog[]

  return (
    <div>
      <Header title="Calendar" />
      <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">

        {/* Controls row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Week / Month toggle */}
          <div className="flex rounded-lg border overflow-hidden shrink-0">
            <Link
              href={`/calendar?view=week&date=${formatDate(anchor)}`}
              className={cn(
                'px-4 py-1.5 text-sm font-medium transition-colors',
                !isMonth ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
              )}
            >
              Week
            </Link>
            <Link
              href={`/calendar?view=month&date=${formatDate(anchor)}`}
              className={cn(
                'px-4 py-1.5 text-sm font-medium transition-colors border-l',
                isMonth ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
              )}
            >
              Month
            </Link>
          </div>

          {/* Period nav */}
          <div className="flex items-center gap-1">
            <Link
              href={`/calendar?view=${view}&date=${prevAnchor}`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="text-sm font-semibold min-w-[140px] text-center">{periodLabel}</span>
            <Link
              href={`/calendar?view=${view}&date=${nextAnchor}`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-8 w-8')}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* AI Summary shortcut */}
          <Link href="/summary" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1 shrink-0')}>
            <Sparkles className="h-4 w-4" />
            AI Summary
          </Link>
        </div>

        {/* Calendar grid */}
        {isMonth ? (
          <MonthCalendar days={days} targets={typedTargets} logs={typedLogs} />
        ) : (
          <WeekCalendar days={days} targets={typedTargets} logs={typedLogs} />
        )}

        {/* Stats */}
        <WeekStats targets={typedTargets} logs={typedLogs} days={days} />

        {/* Per-target numeric metrics */}
        <PeriodMetrics targets={typedTargets} logs={typedLogs} days={days} isMonth={isMonth} />

      </div>
    </div>
  )
}
