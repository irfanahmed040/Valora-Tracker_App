import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { AISummaryCard } from '@/components/summary/AISummaryCard'
import { CustomSummaryCard } from '@/components/summary/CustomSummaryCard'
import { getWeekRange, getMonthRange } from '@/lib/utils'
import { subWeeks, subMonths } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { WeeklySummary } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ view?: string }>
}

export default async function SummaryPage({ searchParams }: PageProps) {
  const { view = 'week' } = await searchParams
  const isMonth = view === 'month'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date()

  // 4 recent periods (current + 3 prior), normalized to { start, end }
  const periods = [0, 1, 2, 3].map(offset => {
    if (isMonth) {
      const { monthStart, monthEnd } = getMonthRange(subMonths(today, offset))
      return { start: monthStart, end: monthEnd }
    }
    const { weekStart, weekEnd } = getWeekRange(subWeeks(today, offset))
    return { start: weekStart, end: weekEnd }
  })

  const windowStart = periods[periods.length - 1].start
  const windowEnd = periods[0].end

  const [{ data: summaries }, { data: logs }] = await Promise.all([
    supabase.from('weekly_summaries').select('*').eq('user_id', user.id).order('week_start', { ascending: false }),
    supabase.from('daily_logs').select('date').eq('user_id', user.id).gte('date', windowStart).lte('date', windowEnd),
  ])

  const summaryMap = new Map((summaries ?? []).map(s => [`${s.week_start}::${s.week_end}`, s as WeeklySummary]))
  const logDates = (logs ?? []).map(l => l.date)

  return (
    <div>
      <Header title="AI Summary" />
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold">AI summaries</h2>
            <p className="text-sm text-muted-foreground">Powered by Groq · llama-3.3-70b-versatile</p>
          </div>

          {/* Week / Month toggle */}
          <div className="flex rounded-lg border overflow-hidden shrink-0">
            <Link
              href="/summary?view=week"
              className={cn(
                'px-4 py-1.5 text-sm font-medium transition-colors',
                !isMonth ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
              )}
            >
              Week
            </Link>
            <Link
              href="/summary?view=month"
              className={cn(
                'px-4 py-1.5 text-sm font-medium transition-colors border-l',
                isMonth ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
              )}
            >
              Month
            </Link>
          </div>
        </div>

        <CustomSummaryCard />

        {periods.map(({ start, end }) => (
          <AISummaryCard
            key={`${start}::${end}`}
            start={start}
            end={end}
            periodType={isMonth ? 'month' : 'week'}
            hasData={logDates.some(d => d >= start && d <= end)}
            existing={summaryMap.get(`${start}::${end}`)}
          />
        ))}
      </div>
    </div>
  )
}
