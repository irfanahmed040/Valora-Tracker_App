import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, Flame, TrendingUp } from 'lucide-react'
import type { Target, DailyLog } from '@/lib/types'

interface WeekStatsProps {
  targets: Target[]
  logs: DailyLog[]
  days: string[]
}

export function WeekStats({ targets, logs, days }: WeekStatsProps) {
  const totalLogs = logs.length
  const completedLogs = logs.filter(l => l.completed).length
  const completionRate = totalLogs > 0 ? Math.round((completedLogs / (targets.length * days.length)) * 100) : 0

  const totalHours = logs
    .filter((_, i) => {
      const t = targets.find(t => t.id === logs[i].target_id)
      return t?.task_type === 'hours'
    })
    .reduce((sum, l) => sum + (l.value ?? 0), 0)

  const bestDay = days.reduce((best, d) => {
    const dayLogs = logs.filter(l => l.date === d)
    const dayCompleted = dayLogs.filter(l => l.completed).length
    const bestLogs = logs.filter(l => l.date === best)
    const bestCompleted = bestLogs.filter(l => l.completed).length
    return dayCompleted > bestCompleted ? d : best
  }, days[0])

  const stats = [
    {
      icon: CheckCircle2,
      label: 'Completion rate',
      value: `${completionRate}%`,
      sub: `${completedLogs} of ${targets.length * days.length} tasks`,
      color: 'text-green-500',
    },
    {
      icon: Clock,
      label: 'Hours logged',
      value: `${totalHours.toFixed(1)}h`,
      sub: 'across all trackers',
      color: 'text-blue-500',
    },
    {
      icon: TrendingUp,
      label: 'Tasks done',
      value: completedLogs.toString(),
      sub: `${totalLogs} logged in total`,
      color: 'text-purple-500',
    },
    {
      icon: Flame,
      label: 'Best day',
      value: bestDay ? new Date(bestDay + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' }) : '—',
      sub: 'most tasks completed',
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ icon: Icon, label, value, sub, color }) => (
        <Card key={label}>
          <CardContent className="pt-4 pb-4">
            <Icon className={`h-4 w-4 mb-2 ${color}`} />
            <div className="text-xl font-bold">{value}</div>
            <div className="text-xs font-medium">{label}</div>
            <div className="text-xs text-muted-foreground">{sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
