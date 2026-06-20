import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { weekStart, weekEnd, periodType = 'week' } = await request.json()
  if (!weekStart || !weekEnd) {
    return NextResponse.json({ error: 'weekStart and weekEnd required' }, { status: 400 })
  }

  const periodNoun = periodType === 'month' ? 'month' : periodType === 'custom' ? 'period' : 'week'
  const numDays = differenceInCalendarDays(parseISO(weekEnd), parseISO(weekStart)) + 1

  const [{ data: targets }, { data: logs }] = await Promise.all([
    supabase.from('targets').select('*').eq('user_id', user.id),
    supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('date', weekStart).lte('date', weekEnd),
  ])

  if (!targets || targets.length === 0) {
    return NextResponse.json({ error: 'No targets found.' }, { status: 400 })
  }

  if (!logs || logs.length === 0) {
    return NextResponse.json({ error: 'No activity in this period — nothing to summarize.' }, { status: 400 })
  }

  // Hard numbers — no inference needed
  const totalTargets = targets.length
  const completedLogs = (logs ?? []).filter(l => l.completed).length
  const totalPossible = totalTargets * numDays

  const totalHours = (logs ?? [])
    .filter(l => targets.find(t => t.id === l.target_id)?.task_type === 'hours')
    .reduce((s, l) => s + (l.value ?? 0), 0)

  // Per-target breakdown with notes
  const perTarget = targets.map(t => {
    const tLogs = (logs ?? []).filter(l => l.target_id === t.id)
    const daysCompleted = tLogs.filter(l => l.completed).length
    const totalValue = tLogs.reduce((s, l) => s + (l.value ?? 0), 0)

    // Collect non-empty notes with day labels
    const notes = tLogs
      .filter(l => l.notes?.trim())
      .map(l => `${format(parseISO(l.date), 'EEE')}: "${l.notes!.trim()}"`)

    return {
      title: t.title,
      task_type: t.task_type,
      scope: t.scope,
      target_value: t.target_value,
      unit: t.unit,
      days_completed: daysCompleted,
      total_value: totalValue,
      notes,
    }
  })

  // Build the data block the AI must work from
  const dataBlock = perTarget.map(t => {
    const goalStr = t.target_value
      ? `, daily goal: ${t.target_value}${t.unit ? ' ' + t.unit : t.task_type === 'hours' ? 'h' : ''}`
      : ''
    const valueStr = t.task_type === 'hours'
      ? `${t.total_value}h total`
      : t.task_type === 'counter'
        ? `${t.total_value} ${t.unit ?? 'total'}`
        : `${t.days_completed}/${numDays} days`
    const noteStr = t.notes.length > 0
      ? `\n    Notes: ${t.notes.join(', ')}`
      : ''
    return `  • ${t.title} (${t.task_type}${goalStr}): completed ${t.days_completed}/${numDays} days, ${valueStr}${noteStr}`
  }).join('\n')

  const prompt = `Period (${periodNoun}): ${weekStart} to ${weekEnd} (${numDays} days)
Overall: ${completedLogs} completed out of ${totalPossible} task-days (${Math.round((completedLogs / Math.max(totalPossible, 1)) * 100)}%)
Total hours tracked: ${totalHours.toFixed(1)}h

Per-target data:
${dataBlock}

Write a productivity review for this ${periodNoun} in markdown. Rules:
- Only reference data shown above. Do NOT invent numbers, days, or facts not listed.
- Quote exact numbers (e.g. "You completed 5 out of ${numDays} days", not "most days").
- If notes are provided, reference specific things the user wrote.
- Be genuinely motivating — celebrate wins, be direct about gaps, and give one concrete suggestion going forward.
- Structure: ## Highlights | ## What to Improve | ## Next Steps
- Under 350 words.`

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          `You are a personal productivity coach analyzing real tracking data for a ${periodNoun}. ` +
          'NEVER invent or extrapolate data that is not in the user message. ' +
          'If data shows 0 completions, say so honestly but encouragingly. ' +
          'Cite exact numbers given. Be warm, specific, and actionable.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 700,
    temperature: 0.2,
  })

  const content = completion.choices[0]?.message?.content ?? 'Could not generate summary.'

  const { data: summary, error } = await supabase
    .from('weekly_summaries')
    .upsert({
      user_id: user.id,
      week_start: weekStart,
      week_end: weekEnd,
      period_type: periodType,
      content,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,week_start,week_end' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ summary })
}
