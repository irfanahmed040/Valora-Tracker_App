'use client'

import Link from 'next/link'
import { format, isToday, parseISO, getDay as getWeekDay } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Target, DailyLog } from '@/lib/types'

interface MonthCalendarProps {
  days: string[]
  targets: Target[]
  logs: DailyLog[]
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function MonthCalendar({ days, targets, logs }: MonthCalendarProps) {
  const logMap = new Map(logs.map(l => [`${l.target_id}::${l.date}`, l]))

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
    return (target.recurring_days as number[]).includes(getWeekDay(parseISO(dateStr)))
  }

  const visibleRecurringTargets = recurringTargets.filter(t => {
    if (t.deleted_at) return days.some(d => logMap.has(`${t.id}::${d}`))
    return days.some(d => isScheduled(t, d))
  })

  // Calendar grid offset (Mon-based)
  const firstDay = parseISO(days[0])
  const rawDay = getWeekDay(firstDay)
  const offset = rawDay === 0 ? 6 : rawDay - 1
  const slots: (string | null)[] = [...Array(offset).fill(null), ...days]
  while (slots.length % 7 !== 0) slots.push(null)

  function getCellStyle(d: string, target: Target): { pct: number; color: string; log: DailyLog | undefined } {
    const log = logMap.get(`${target.id}::${d}`) as DailyLog | undefined
    const done = log?.completed
    const hasValue = (log?.value ?? 0) > 0
    const pct = target.target_value && log?.value
      ? Math.min(100, (log.value / target.target_value) * 100)
      : done ? 100 : hasValue ? 50 : 0
    return { pct, color: target.color, log }
  }

  function cellLabel(target: Target, log: DailyLog | undefined): string {
    if (!log) return ''
    if (target.task_type === 'checkbox') return log.completed ? '✓' : ''
    const v = log.value ?? 0
    if (v === 0) return ''
    return String(v)
  }

  return (
    <div className="space-y-8">
      {/* ── Calendar grid ── */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[300px]">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_HEADERS.map(h => (
              <div key={h} className="text-center text-[11px] font-medium text-muted-foreground py-1">{h}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {slots.map((d, i) => {
              if (!d) return <div key={i} />
              const parsed = parseISO(d)
              const isTodayDate = isToday(parsed)
              const completed = recurringTargets.filter(t => logMap.get(`${t.id}::${d}`)?.completed).length
              const total = recurringTargets.length
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0
              const dayOneoffs = getOneoffs(d)

              return (
                <Link
                  key={d}
                  href={`/day/${d}`}
                  className={cn(
                    'flex flex-col items-start gap-0.5 p-1 rounded-xl transition-colors hover:bg-muted min-h-14',
                    isTodayDate && 'bg-primary/10'
                  )}
                >
                  {/* Date number */}
                  <span className={cn(
                    'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full self-center',
                    isTodayDate ? 'bg-primary text-primary-foreground' : ''
                  )}>
                    {format(parsed, 'd')}
                  </span>

                  {/* Recurring completion bar */}
                  {total > 0 && pct > 0 && (
                    <div className="w-full px-0.5">
                      <div
                        className="h-0.5 rounded-full"
                        style={{ backgroundColor: recurringTargets[0]?.color ?? '#6366f1', opacity: 0.4 + pct * 0.006 }}
                      />
                    </div>
                  )}

                  {/* One-off event pills */}
                  {dayOneoffs.map(t => {
                    const log = logMap.get(`${t.id}::${d}`)
                    const done = log?.completed
                    return (
                      <div
                        key={t.id}
                        className="w-full flex items-center gap-0.5 rounded px-1 py-0.5 text-[8px] font-medium"
                        style={{
                          backgroundColor: t.color + (done ? '55' : '22'),
                          color: t.color,
                          textDecoration: done ? 'line-through' : 'none',
                          opacity: done ? 0.7 : 1,
                        }}
                        title={t.title}
                      >
                        <span className="shrink-0 text-[10px]">{t.emoji}</span>
                        <span className="truncate leading-tight">{t.title}</span>
                      </div>
                    )
                  })}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Per-target tracker rows — recurring only, hidden if all-blank in this period ── */}
      {visibleRecurringTargets.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tracker breakdown
          </h3>
          {/* Desktop: dense fixed-cell rows with numbers (scrolls if wide) */}
          <div className="hidden md:block overflow-x-auto -mx-4 px-4">
            <div style={{ minWidth: `${130 + days.length * 26}px` }}>
              {/* Day number header */}
              <div className="flex gap-0.5 mb-1 pl-[130px]">
                {days.map(d => {
                  const parsed = parseISO(d)
                  const isTodayDate = isToday(parsed)
                  return (
                    <div
                      key={d}
                      className={cn(
                        'w-6 text-center text-[9px] font-medium shrink-0',
                        isTodayDate ? 'text-primary font-bold' : 'text-muted-foreground'
                      )}
                    >
                      {format(parsed, 'd')}
                    </div>
                  )
                })}
              </div>

              {/* Rows */}
              {visibleRecurringTargets.map(target => (
                <div key={target.id} className="flex items-center gap-0.5 mb-1">
                  <div className="flex items-center gap-1.5 w-[130px] shrink-0 min-w-0 pr-2">
                    <span className="text-base shrink-0">{target.emoji}</span>
                    <span className="text-xs font-medium truncate">{target.title}</span>
                  </div>
                  {days.map(d => {
                    if (!isScheduled(target, d)) {
                      return (
                        <div key={d} className="shrink-0 w-6 h-7 rounded-md bg-muted/30 flex items-center justify-center">
                          <span className="text-[8px] text-muted-foreground/40 select-none">–</span>
                        </div>
                      )
                    }
                    const { pct, color, log } = getCellStyle(d, target)
                    const isTodayDate = isToday(parseISO(d))
                    const label = cellLabel(target, log)
                    return (
                      <Link key={d} href={`/day/${d}`} className="shrink-0">
                        <div
                          className={cn(
                            'w-6 h-7 rounded-md transition-all hover:scale-105 hover:brightness-110 flex items-center justify-center',
                            pct === 0 ? 'bg-muted' : '',
                            isTodayDate && pct === 0 ? 'ring-1 ring-primary/30' : ''
                          )}
                          style={{
                            backgroundColor: pct > 0 ? color : undefined,
                            opacity: pct > 0 ? 0.25 + (pct / 100) * 0.75 : 1,
                          }}
                          title={`${target.title} — ${d}`}
                        >
                          {label && (
                            <span className="text-[8px] font-bold leading-none select-none" style={{ color: pct > 60 ? '#fff' : 'currentColor' }}>
                              {label}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: full-width heatmap, cells flex to fit (color-only, no zoom) */}
          <div className="md:hidden space-y-1">
            {visibleRecurringTargets.map(target => (
              <div key={target.id} className="flex items-center gap-1">
                <div className="w-16 shrink-0 flex items-center gap-1 min-w-0">
                  <span className="text-sm shrink-0">{target.emoji}</span>
                  <span className="text-[10px] font-medium truncate">{target.title}</span>
                </div>
                <div className="flex gap-px flex-1">
                  {days.map(d => {
                    if (!isScheduled(target, d)) {
                      return <div key={d} className="flex-1 h-5 rounded-[2px] bg-muted/30" />
                    }
                    const { pct, color } = getCellStyle(d, target)
                    return (
                      <Link key={d} href={`/day/${d}`} className="flex-1">
                        <div
                          className={cn('h-5 rounded-[2px]', pct === 0 && 'bg-muted')}
                          style={{
                            backgroundColor: pct > 0 ? color : undefined,
                            opacity: pct > 0 ? 0.25 + (pct / 100) * 0.75 : 1,
                          }}
                          title={`${target.title} — ${d}`}
                        />
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
