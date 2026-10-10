import { Card, CardContent } from '@/components/ui/card'
import { Dumbbell, Layers, Weight, CalendarCheck, Trophy } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ClearFitnessButton } from './ClearFitnessButton'
import { cn } from '@/lib/utils'
import type { WorkoutSet } from '@/lib/types'

const ACCENT = '#6D28FF'

interface FitnessAnalyticsProps {
  userId: string
  sets: WorkoutSet[]     // workout sets within the selected period
  allSets: WorkoutSet[]  // all-time sets, for personal records
  days: string[]         // period days (yyyy-MM-dd)
}

// PR ranking: higher weight wins; tie → more reps; tie → more recent
function isBetter(a: WorkoutSet, b: WorkoutSet): boolean {
  const wa = a.weight ?? 0
  const wb = b.weight ?? 0
  if (wa !== wb) return wa > wb
  if (a.reps !== b.reps) return a.reps > b.reps
  return a.created_at > b.created_at
}

export function FitnessAnalytics({ userId, sets, allSets, days }: FitnessAnalyticsProps) {
  const inRange = sets.filter(s => days.includes(s.date))

  // Period totals
  const totalSets = inRange.length
  const totalReps = inRange.reduce((a, s) => a + s.reps, 0)
  const totalVolume = Math.round(inRange.reduce((a, s) => a + s.reps * (s.weight ?? 0), 0))
  const activeDays = new Set(inRange.map(s => s.date)).size

  // Most-trained exercise (by set count)
  const byExercise = new Map<string, number>()
  for (const s of inRange) byExercise.set(s.exercise, (byExercise.get(s.exercise) ?? 0) + 1)
  const topExercise = [...byExercise.entries()].sort((a, b) => b[1] - a[1])[0]

  // Group by day (desc), each day → exercises → sets
  const dayMap = new Map<string, WorkoutSet[]>()
  for (const s of inRange) {
    const arr = dayMap.get(s.date)
    if (arr) arr.push(s)
    else dayMap.set(s.date, [s])
  }
  const dayEntries = [...dayMap.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))

  // All-time personal records per exercise (weight → reps → recency)
  const prBest = new Map<string, WorkoutSet>()
  for (const s of allSets) {
    const cur = prBest.get(s.exercise)
    if (!cur || isBetter(s, cur)) prBest.set(s.exercise, s)
  }
  const prSetIds = new Set([...prBest.values()].map(s => s.id))

  const stats = [
    { icon: CalendarCheck, label: 'Active days', value: String(activeDays), sub: `of ${days.length} in period`, color: 'text-green-500' },
    { icon: Layers, label: 'Total sets', value: String(totalSets), sub: `${totalReps} reps total`, color: 'text-purple-500' },
    { icon: Weight, label: 'Volume', value: `${totalVolume.toLocaleString()} kg`, sub: 'reps × weight', color: 'text-blue-500' },
    { icon: Trophy, label: 'Top exercise', value: topExercise ? topExercise[0] : '—', sub: topExercise ? `${topExercise[1]} sets` : 'no data', color: 'text-orange-500' },
  ]

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #4F8DFD)` }}
          >
            <Dumbbell className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Fitness</h2>
        </div>
        <ClearFitnessButton userId={userId} setCount={totalSets} />
      </div>

      {totalSets === 0 ? (
        <Card className="rounded-2xl border border-foreground/10 bg-card/70">
          <CardContent className="py-10 flex flex-col items-center gap-2 text-center">
            <Dumbbell className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No sets logged this period</p>
            <p className="text-sm text-muted-foreground">Log workouts on the Fitness page to see them here</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ icon: Icon, label, value, sub, color }) => (
              <Card key={label} className="rounded-2xl">
                <CardContent className="pt-4 pb-4">
                  <Icon className={`h-4 w-4 mb-2 ${color}`} />
                  <div className="text-xl font-bold truncate" title={value}>{value}</div>
                  <div className="text-xs font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">{sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed per-day table */}
          <Card className="rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-4 py-2.5 font-semibold">Day</th>
                      <th className="px-4 py-2.5 font-semibold">Exercise</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Sets</th>
                      <th className="px-4 py-2.5 font-semibold">Detail (reps × kg)</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayEntries.map(([day, daySets]) => {
                      // group day's sets by exercise
                      const exMap = new Map<string, WorkoutSet[]>()
                      for (const s of daySets) {
                        const arr = exMap.get(s.exercise)
                        if (arr) arr.push(s)
                        else exMap.set(s.exercise, [s])
                      }
                      const exEntries = [...exMap.entries()]
                      const dayVolume = Math.round(daySets.reduce((a, s) => a + s.reps * (s.weight ?? 0), 0))

                      return exEntries.map(([exercise, exSets], i) => {
                        const exVolume = Math.round(exSets.reduce((a, s) => a + s.reps * (s.weight ?? 0), 0))
                        const rowHasPR = exSets.some(s => prSetIds.has(s.id))
                        return (
                          <tr
                            key={`${day}-${exercise}`}
                            className={cn(
                              'border-b last:border-0 transition-colors',
                              rowHasPR ? 'bg-amber-500/[0.08] hover:bg-amber-500/[0.12]' : 'hover:bg-muted/30'
                            )}
                          >
                            {i === 0 ? (
                              <td
                                className="px-4 py-2.5 align-top font-semibold whitespace-nowrap"
                                rowSpan={exEntries.length}
                              >
                                <div>{format(parseISO(day), 'EEE')}</div>
                                <div className="text-xs text-muted-foreground font-normal">{format(parseISO(day), 'dd/MM')}</div>
                                <div className="text-[11px] text-muted-foreground font-normal mt-0.5">{dayVolume.toLocaleString()} kg</div>
                              </td>
                            ) : null}
                            <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                {exercise}
                                {rowHasPR && <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span
                                className="inline-block min-w-6 rounded-full px-2 py-0.5 text-xs font-bold"
                                style={{ color: ACCENT, background: `${ACCENT}1a` }}
                              >
                                {exSets.length}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">
                              {exSets.map((s, j) => {
                                const isPR = prSetIds.has(s.id)
                                const label = s.weight != null ? `${s.reps}×${s.weight}` : `${s.reps}×BW`
                                return (
                                  <span key={s.id}>
                                    {j > 0 && <span className="text-muted-foreground">, </span>}
                                    <span
                                      className={cn(
                                        isPR
                                          ? 'font-bold text-amber-600 dark:text-amber-400 rounded px-1 bg-amber-500/15'
                                          : 'text-muted-foreground'
                                      )}
                                      title={isPR ? 'Personal record' : undefined}
                                    >
                                      {label}{isPR ? ' 🏆' : ''}
                                    </span>
                                  </span>
                                )
                              })}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap">
                              {exVolume > 0 ? `${exVolume.toLocaleString()} kg` : '—'}
                            </td>
                          </tr>
                        )
                      })
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  )
}
