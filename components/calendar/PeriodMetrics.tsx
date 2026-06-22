import { getDay, parseISO, format } from 'date-fns'
import { formatDate } from '@/lib/utils'
import type { Target, DailyLog } from '@/lib/types'

interface PeriodMetricsProps {
  targets: Target[]
  logs: DailyLog[]
  days: string[]
  isMonth: boolean
}

function isScheduledDay(target: Target, dateStr: string): boolean {
  if (target.deleted_at && dateStr >= target.deleted_at.substring(0, 10)) return false
  if (target.start_date && dateStr < target.start_date) return false
  if (target.end_date && dateStr > target.end_date) return false
  if (target.scope === 'oneoff') return target.specific_date === dateStr
  if (target.scope !== 'daily') return true
  if (!target.recurring_days || target.recurring_days.length === 0) return true
  return (target.recurring_days as number[]).includes(getDay(parseISO(dateStr)))
}

function buildMetric(target: Target, logs: DailyLog[], days: string[]) {
  const logMap = new Map(logs.map(l => [l.date, l]))
  const scheduledDays = days.filter(d => isScheduledDay(target, d))
  const scheduledCount = scheduledDays.length

  if (target.task_type === 'checkbox') {
    const completedDays = scheduledDays.filter(d => logMap.get(d)?.completed).length
    const pct = scheduledCount > 0 ? Math.round((completedDays / scheduledCount) * 100) : 0
    return { displayTotal: String(completedDays), displayGoal: String(scheduledCount), unit: 'days', pct, hasGoal: true }
  }

  const total = scheduledDays.reduce((sum, d) => sum + (logMap.get(d)?.value ?? 0), 0)

  let periodGoal: number | null = null
  if (target.recurring_days && target.recurring_days.length > 0) {
    if (target.target_value) periodGoal = Math.round(target.target_value * scheduledCount * 10) / 10
  } else if (target.weekly_goal) {
    periodGoal = Math.round((target.weekly_goal * (days.length / 7)) * 10) / 10
  } else if (target.target_value) {
    periodGoal = Math.round(target.target_value * scheduledCount * 10) / 10
  }

  const pct = periodGoal ? Math.min(100, Math.round((total / periodGoal) * 100)) : null
  const unit = target.task_type === 'hours' ? 'h' : (target.unit ?? '')
  const displayTotal = total % 1 === 0 ? String(total) : total.toFixed(1)
  const displayGoal = periodGoal ? (periodGoal % 1 === 0 ? String(periodGoal) : periodGoal.toFixed(1)) : null

  return { displayTotal, displayGoal, unit, pct, hasGoal: !!periodGoal }
}

function DonutChart({
  target,
  metric,
}: {
  target: Target
  metric: ReturnType<typeof buildMetric>
}) {
  const { displayTotal, displayGoal, unit, pct, hasGoal } = metric
  const r = 36
  const circ = 2 * Math.PI * r
  const filled = hasGoal ? (Math.min(pct ?? 0, 100) / 100) * circ : 0
  const color = target.color ?? '#6D28FF'

  // Fit long text
  const valStr = `${displayTotal}${unit}`
  const valSize = valStr.length > 6 ? 10 : valStr.length > 4 ? 12 : 14

  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <div className="relative">
        <svg width="110" height="110" viewBox="0 0 100 100">
          {/* Track */}
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
            className="text-muted/25"
          />
          {/* Progress arc */}
          {hasGoal && (
            <circle
              cx="50" cy="50" r={r}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circ}`}
              transform="rotate(-90 50 50)"
              style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
            />
          )}
          {/* No-goal indicator ring */}
          {!hasGoal && (
            <circle
              cx="50" cy="50" r={r}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeOpacity="0.35"
            />
          )}

          {/* Inner content */}
          {/* Emoji */}
          <text x="50" y="35" textAnchor="middle" fontSize="16" dominantBaseline="middle">
            {target.emoji}
          </text>
          {/* Value */}
          <text
            x="50" y="51"
            textAnchor="middle"
            fontSize={valSize}
            fontWeight="700"
            fill={color}
            dominantBaseline="middle"
          >
            {valStr}
          </text>
          {/* Goal or pct */}
          {hasGoal && displayGoal ? (
            <>
              <text x="50" y="63" textAnchor="middle" fontSize="8" fill="gray" dominantBaseline="middle">
                / {displayGoal}{unit}
              </text>
              <text x="50" y="74" textAnchor="middle" fontSize="10" fontWeight="600" fill={color} dominantBaseline="middle">
                {pct}%
              </text>
            </>
          ) : (
            <text x="50" y="66" textAnchor="middle" fontSize="8" fill="gray" dominantBaseline="middle">
              logged
            </text>
          )}
        </svg>
      </div>
      {/* Title below */}
      <span className="text-xs font-medium text-center leading-tight max-w-[90px] truncate">
        {target.title}
      </span>
    </div>
  )
}

export function PeriodMetrics({ targets, logs, days, isMonth }: PeriodMetricsProps) {
  if (targets.length === 0) return null

  const today = formatDate(new Date())
  const effectiveDays = days.filter(d => d <= today) // elapsed days only
  const hasFuture = days.some(d => d > today)

  const recurring = targets.filter(t => {
    if (t.scope === 'oneoff') return false
    if (t.deleted_at) return logs.some(l => l.target_id === t.id && days.includes(l.date))
    return days.some(d => isScheduledDay(t, d))
  })
  const oneoffs = targets.filter(t => t.scope === 'oneoff')
  const visibleOneoffs = oneoffs.filter(t => t.specific_date && days.includes(t.specific_date))

  if (recurring.length === 0 && visibleOneoffs.length === 0) return null

  const label = isMonth ? 'this month' : 'this week'

  return (
    <div className="space-y-6">
      {recurring.length > 0 && (
        <section className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Metrics — {label}
            </h3>
            {hasFuture && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Counts days so far (through today).</p>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 justify-items-center">
            {recurring.map(target => {
              const logsForTarget = logs.filter(l => l.target_id === target.id)
              return (
                <DonutChart
                  key={target.id}
                  target={target}
                  metric={buildMetric(target, logsForTarget, effectiveDays)}
                />
              )
            })}
          </div>
        </section>
      )}

      {visibleOneoffs.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            One-off tasks
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 justify-items-center">
            {visibleOneoffs.map(target => {
              const logsForTarget = logs.filter(l => l.target_id === target.id)
              const dateLabel = target.specific_date
                ? format(parseISO(target.specific_date), 'dd/MM/yyyy')
                : ''
              return (
                <div key={target.id} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {dateLabel}
                  </span>
                  <DonutChart
                    target={target}
                    metric={buildMetric(target, logsForTarget, days)}
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
