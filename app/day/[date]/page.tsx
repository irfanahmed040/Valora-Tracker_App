import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { TaskCard } from '@/components/tasks/TaskCard'
import { Progress } from '@/components/ui/progress'
import { NewTargetButton } from '@/components/targets/NewTargetButton'
import { OneoffTaskButton } from '@/components/targets/OneoffTaskButton'
import { TargetManager } from '@/components/targets/TargetManager'
import { calcStreak } from '@/lib/utils'
import { LayoutDashboard } from 'lucide-react'
import type { Target, DailyLog } from '@/lib/types'
import { isValid, parseISO, subDays, format, getDay } from 'date-fns'

interface Props {
  params: Promise<{ date: string }>
}

export default async function DayPage({ params }: Props) {
  const { date } = await params

  if (!isValid(parseISO(date))) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dayOfWeek = getDay(parseISO(date)) // 0=Sun … 6=Sat

  const [{ data: targets }, { data: logs }] = await Promise.all([
    supabase.from('targets').select('*').eq('user_id', user.id).order('priority', { ascending: false }).order('created_at'),
    supabase.from('daily_logs').select('*, increments(*)').eq('user_id', user.id).eq('date', date),
  ])

  const allTargets = (targets ?? []) as Target[]
  const activeTargets = allTargets.filter(t => t.active && !t.deleted_at)
  const pausedTargets = allTargets.filter(t => !t.active && !t.deleted_at)

  const logMap = new Map((logs ?? []).map(l => [l.target_id, l as DailyLog]))

  // Filter targets visible on this date (active only)
  const visibleTargets = activeTargets.filter(t => {
    // Date range gate
    if (t.start_date && date < t.start_date) return false
    if (t.end_date && date > t.end_date) return false
    if (t.scope === 'daily') {
      if (!t.recurring_days || t.recurring_days.length === 0) return true
      return (t.recurring_days as number[]).includes(dayOfWeek)
    }
    if (t.scope === 'weekly') return true
    if (t.scope === 'oneoff') return t.specific_date === date
    return false
  }) as Target[]

  const dailyTargets = visibleTargets.filter(t => t.scope === 'daily')
  const weeklyTargets = visibleTargets.filter(t => t.scope === 'weekly')
  const oneoffTargets = visibleTargets.filter(t => t.scope === 'oneoff')

  const completed = visibleTargets.filter(t => logMap.get(t.id)?.completed).length
  const total = visibleTargets.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  // Fetch last 30 days logs for streak computation
  const past30Start = format(subDays(parseISO(date), 30), 'yyyy-MM-dd')
  const { data: pastLogs } = await supabase
    .from('daily_logs')
    .select('target_id, date, completed')
    .eq('user_id', user.id)
    .gte('date', past30Start)
    .lte('date', date)

  function getStreak(targetId: string): number {
    const tLogs = (pastLogs ?? []).filter(l => l.target_id === targetId) as DailyLog[]
    return calcStreak(tLogs)
  }

  return (
    <div>
      <Header date={date} showDateNav />

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
        {/* Top section — progress bar, then action buttons */}
        <div className="space-y-3">
          {total > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Today's progress</span>
                <span className="text-muted-foreground">{completed}/{total} · {pct}%</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <OneoffTaskButton userId={user.id} date={date} />
            <TargetManager
              activeTargets={activeTargets}
              pausedTargets={pausedTargets}
              userId={user.id}
            />
          </div>
        </div>

        {total === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium">Nothing scheduled today</p>
              <p className="text-sm text-muted-foreground">Add a target or create a one-off task for this day</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <NewTargetButton userId={user.id} />
              <OneoffTaskButton userId={user.id} date={date} />
            </div>
          </div>
        )}

        {/* Daily targets */}
        {dailyTargets.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Daily targets</h2>
            {dailyTargets.map(target => (
              <TaskCard
                key={target.id}
                target={target}
                log={logMap.get(target.id) ?? null}
                date={date}
                userId={user.id}
                streak={getStreak(target.id)}
              />
            ))}
          </section>
        )}

        {/* Weekly targets */}
        {weeklyTargets.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Weekly targets</h2>
            {weeklyTargets.map(target => (
              <TaskCard
                key={target.id}
                target={target}
                log={logMap.get(target.id) ?? null}
                date={date}
                userId={user.id}
                streak={getStreak(target.id)}
              />
            ))}
          </section>
        )}

        {/* One-off tasks for this date */}
        {oneoffTargets.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">One-off tasks</h2>
            {oneoffTargets.map(target => (
              <TaskCard
                key={target.id}
                target={target}
                log={logMap.get(target.id) ?? null}
                date={date}
                userId={user.id}
                streak={0}
              />
            ))}
          </section>
        )}


      </div>
    </div>
  )
}
