'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { TallyMarks } from './TallyMarks'
import { InlineHourControl } from './InlineHourControl'
import { CounterControl } from './CounterControl'
import { Flame, CheckCircle2, StickyNote, X } from 'lucide-react'
import { cn, calcCompletionPercent } from '@/lib/utils'
import { toast } from 'sonner'
import type { Target, DailyLog } from '@/lib/types'

interface TaskCardProps {
  target: Target
  log: DailyLog | null
  date: string
  userId: string
  streak: number
}

export function TaskCard({ target, log, date, userId, streak }: TaskCardProps) {
  const [loading, setLoading] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState(log?.notes ?? '')
  const [savingNote, setSavingNote] = useState(false)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // Live optimistic state — bar/labels update instantly, independent of router.refresh()
  const [value, setValue] = useState(log?.value ?? 0)
  const [done, setDone] = useState(log?.completed ?? false)
  useEffect(() => {
    setValue(log?.value ?? 0)
    setDone(log?.completed ?? false)
  }, [log?.value, log?.completed])

  const liveLog = { ...(log ?? {}), value, completed: done } as DailyLog
  const pct = calcCompletionPercent(liveLog, target)
  const isDone = done
  const hasNote = !!log?.notes
  const color = target.color

  async function toggleCheckbox(checked: boolean) {
    setLoading(true)
    setDone(checked) // optimistic
    setValue(checked ? 1 : 0)
    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: userId,
        target_id: target.id,
        date,
        value: checked ? 1 : 0,
        completed: checked,
      }, { onConflict: 'user_id,target_id,date' })

    if (error) {
      toast.error('Failed to update')
      setDone(!checked) // revert
      setValue(!checked ? 1 : 0)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  async function saveNote() {
    setSavingNote(true)
    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: userId,
        target_id: target.id,
        date,
        value: log?.value ?? 0,
        completed: log?.completed ?? false,
        notes: noteText.trim() || null,
      }, { onConflict: 'user_id,target_id,date' })

    if (error) toast.error('Failed to save note')
    else {
      toast.success('Note saved')
      setNoteOpen(false)
      router.refresh()
    }
    setSavingNote(false)
  }

  function openNote() {
    setNoteText(log?.notes ?? '')
    setNoteOpen(true)
    setTimeout(() => noteRef.current?.focus(), 50)
  }

  return (
    <Card
      className={cn(
        'relative isolate overflow-hidden rounded-2xl border border-foreground/10 bg-card/70 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        isDone && 'animate-card-pop'
      )}
      style={isDone ? { boxShadow: `inset 0 0 0 1px ${color}80` } : undefined}
    >
      {/* Diagonal gradient wash */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: `linear-gradient(135deg, ${color}${isDone ? '3a' : '26'} 0%, ${color}0a 32%, transparent 62%)` }}
      />
      {/* Faint oversized emoji watermark */}
      <span
        aria-hidden
        className="absolute -right-3 -top-5 text-[92px] leading-none rotate-12 opacity-20 select-none pointer-events-none"
      >
        {target.emoji}
      </span>

      <CardContent className="relative pt-4 pb-3">
        <div className="flex items-start gap-3">
          <span
            className="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center text-2xl leading-none"
            style={{
              background: `linear-gradient(135deg, ${color}38, ${color}12)`,
              boxShadow: `inset 0 0 0 1px ${color}55, 0 2px 8px ${color}24`,
            }}
          >
            {target.emoji}
          </span>
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[15px] font-semibold tracking-tight" style={isDone ? { color } : undefined}>
                  {target.title}
                </h3>
                {isDone && <CheckCircle2 className="h-4 w-4 shrink-0 animate-pop-in" style={{ color }} />}
                {streak >= 3 && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold tracking-wide',
                      streak >= 30
                        ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white shadow-[0_0_10px_rgba(236,72,153,0.6)]'
                        : streak >= 14
                        ? 'bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 text-white shadow-[0_0_8px_rgba(251,146,60,0.6)]'
                        : streak >= 7
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-400 text-white shadow-[0_0_6px_rgba(251,146,60,0.5)]'
                        : 'bg-orange-500/15 text-orange-500 border border-orange-500/30'
                    )}
                  >
                    <Flame className={cn(
                      'h-3 w-3',
                      streak >= 7 ? 'text-white drop-shadow-sm' : 'text-orange-500'
                    )} />
                    {streak} streak{streak >= 30 ? ' 🔥' : ''}
                  </span>
                )}
              </div>

              <button
                onClick={openNote}
                className={cn(
                  'shrink-0 rounded-md px-2 py-1 text-xs font-medium flex items-center gap-1 transition-colors',
                  hasNote
                    ? 'text-amber-500 hover:text-amber-600'
                    : 'text-muted-foreground/60 hover:text-muted-foreground'
                )}
              >
                <StickyNote className="h-3 w-3" />
                {hasNote ? 'Edit note' : 'Add note'}
              </button>
            </div>

            {target.description && (
              <p className="text-xs text-muted-foreground mb-2">{target.description}</p>
            )}

            {/* Existing note preview */}
            {hasNote && !noteOpen && (
              <p className="text-xs text-amber-600 dark:text-amber-400 italic mb-2 line-clamp-2">
                "{log?.notes}"
              </p>
            )}

            {/* Hours type */}
            {target.task_type === 'hours' && (
              <div className="space-y-2 mt-1">
                <InlineHourControl
                  target={target}
                  log={log}
                  date={date}
                  userId={userId}
                  color={color}
                  onValueChange={setValue}
                />
                <TallyMarks count={Math.floor(value)} color={target.color} />
                {target.target_value && <ColorBar pct={pct} color={color} />}
              </div>
            )}

            {/* Checkbox type */}
            {target.task_type === 'checkbox' && (
              <button
                type="button"
                disabled={loading}
                onClick={() => toggleCheckbox(!isDone)}
                className={cn(
                  'mt-2 w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60',
                  !isDone && 'border-2 bg-transparent'
                )}
                style={
                  isDone
                    ? { backgroundColor: color, color: '#fff', boxShadow: `0 4px 14px ${color}66` }
                    : { borderColor: color, color }
                }
              >
                {isDone ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 animate-pop-in" />
                    Completed!
                  </>
                ) : (
                  'Mark as done'
                )}
              </button>
            )}

            {/* Counter type */}
            {target.task_type === 'counter' && (
              <div className="mt-2">
                <CounterControl target={target} log={log} date={date} userId={userId} color={color} onValueChange={setValue} />
                {target.target_value && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{value} / {target.target_value} {target.unit}</span>
                    </div>
                    <ColorBar pct={pct} color={color} />
                  </div>
                )}
              </div>
            )}

            {/* Inline note editor */}
            {noteOpen && (
              <div className="mt-3 space-y-2">
                <Textarea
                  ref={noteRef}
                  placeholder="What did you do? How did it go?"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveNote} disabled={savingNote} className="h-7 text-xs">
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setNoteOpen(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ColorBar({ pct, color }: { pct: number; color: string }) {
  const done = pct >= 100
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
      <span
        className="text-[11px] font-bold tabular-nums shrink-0 rounded-full px-1.5 py-0.5"
        style={{ color, background: `${color}1a` }}
      >
        {done ? 'DONE' : `${pct}%`}
      </span>
    </div>
  )
}
