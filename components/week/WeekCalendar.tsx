'use client'

import Link from 'next/link'
import { format, isToday, parseISO, getDay } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Target, DailyLog } from '@/lib/types'

interface WeekCalendarProps {
  days: string[]
  targets: Target[]
  logs: DailyLog[]
}

export function WeekCalendar({ days, targets, logs }: WeekCalendarProps) {
  const logMap = new Map(logs.map(l => [`${l.target_id}::${l.date}`, l]))

  // Only recurring targets (active or soft-deleted with history) go in tracker rows
  const recurringTargets = targets.filter(t =>
    (t.scope === 'daily' || t.scope === 'weekly') && (t.active || !!t.deleted_at)
  )
  const oneoffTargets = targets.filter(t => t.scope === 'oneoff')

  function getOneoffs(d: string): Target[] {
    return oneoffTargets.filter(t => t.specific_date === d)
  }

  function isScheduled(target: Target, dateStr: string): boolean {
    if (target.deleted_at && dateStr >= target.deleted_at.substring(0, 10)) return false
    if (target.start_date && dateStr < target.start_date) return false
    if (target.end_date && dateStr > target.end_date) return false
    if (target.scope !== 'daily') return true
    if (!target.recurring_days || target.recurring_days.length === 0) return true
    return (target.recurring_days as number[]).includes(getDay(parseISO(dateStr)))
  }

  const visibleRecurringTargets = recurringTargets.filter(t => {
    if (t.deleted_at) return days.some(d => logMap.has(`${t.id}::${d}`))
    return days.some(d => isScheduled(t, d))
  })

  function cellLabel(target: Target, log: ReturnType<typeof logMap.get>): string {
    if (!log) return ''
    if (target.task_type === 'checkbox') return log.completed ? '✓' : ''
    const v = log.value ?? 0
    if (v === 0) return ''
    return v % 1 === 0 ? String(v) : String(v)
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="min-w-[320px]">
        {/* Day header columns */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {days.map(d => {
            const parsed = parseISO(d)
            const dayOneoffs = getOneoffs(d)
            return (
              <Link
                key={d}
                href={`/day/${d}`}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 rounded-xl transition-colors hover:bg-muted',
                  isToday(parsed) && 'bg-primary/10'
                )}
              >
                <span className="text-xs text-muted-foreground font-medium">
                  {format(parsed, 'EEE')}
                </span>
                <span className={cn(
                  'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full',
                  isToday(parsed) ? 'bg-primary text-primary-foreground' : 'text-foreground'
                )}>
                  {format(parsed, 'd')}
                </span>

                {/* Completion dots — recurring only */}
                <div className="flex flex-wrap justify-center gap-0.5 min-h-4">
                  {recurringTargets.slice(0, 6).map(t => {
                    const log = logMap.get(`${t.id}::${d}`)
                    const done = log?.completed
                    const hasValue = (log?.value ?? 0) > 0
                    return (
                      <span
                        key={t.id}
                        className={cn('w-2 h-2 rounded-full', done ? 'opacity-100' : hasValue ? 'opacity-50' : 'opacity-20 bg-muted-foreground')}
                        style={{ backgroundColor: done || hasValue ? t.color : undefined }}
                        title={t.title}
                      />
                    )
                  })}
                </div>

                {/* One-off event pills */}
                {dayOneoffs.length > 0 && (
                  <div className="w-full flex flex-col gap-0.5 mt-0.5 px-0.5">
                    {dayOneoffs.map(t => (
                      <div
                        key={t.id}
                        className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium truncate"
                        style={{ backgroundColor: t.color + '33', color: t.color }}
                        title={t.title}
                      >
                        <span className="shrink-0">{t.emoji}</span>
                        <span className="truncate leading-tight">{t.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>

        {/* Per-target tracker rows — recurring only, hidden if all-blank in this period */}
        {visibleRecurringTargets.length > 0 && (
          <div className="space-y-2 mt-4">
            {visibleRecurringTargets.map(target => (
              <div key={target.id} className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">{target.emoji}</span>
                  <span className="text-xs font-medium truncate">{target.title}</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map(d => {
                    if (!isScheduled(target, d)) {
                      return (
                        <div key={d} className="h-7 rounded-md bg-muted/30 flex items-center justify-center">
                          <span className="text-[9px] text-muted-foreground/40 select-none">–</span>
                        </div>
                      )
                    }
                    const log = logMap.get(`${target.id}::${d}`)
                    const done = log?.completed
                    const hasValue = (log?.value ?? 0) > 0
                    const pct = target.target_value && log?.value
                      ? Math.min(100, (log.value / target.target_value) * 100)
                      : done ? 100 : hasValue ? 50 : 0
                    const label = cellLabel(target, log)
                    return (
                      <Link key={d} href={`/day/${d}`}>
                        <div
                          className={cn('h-7 rounded-md transition-all hover:scale-105 flex items-center justify-center', pct === 0 ? 'bg-muted' : '')}
                          style={{
                            backgroundColor: pct > 0 ? target.color : undefined,
                            opacity: pct > 0 ? 0.3 + (pct / 100) * 0.7 : 1,
                          }}
                          title={`${target.title} on ${d}: ${log?.value ?? 0}`}
                        >
                          {label && (
                            <span className="text-[9px] font-bold leading-none select-none" style={{ color: pct > 60 ? '#fff' : 'currentColor' }}>
                              {label}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
