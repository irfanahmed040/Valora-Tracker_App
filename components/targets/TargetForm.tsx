'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, COLORS, formatDate } from '@/lib/utils'
import { Clock, CheckSquare, Hash, Loader2, CalendarDays, Repeat } from 'lucide-react'
import { EmojiPicker } from './EmojiPicker'
import type { Target, Scope } from '@/lib/types'

interface TargetFormProps {
  userId: string
  existing?: Target
  onSuccess?: () => void
  defaultDate?: string  // pre-fill specific_date for oneoff tasks
}

const taskTypeOptions = [
  { value: 'hours', icon: Clock, label: 'Track Hours', desc: 'Log time — shown as tally marks' },
  { value: 'checkbox', icon: CheckSquare, label: 'Checkbox', desc: 'Simple done / not done' },
  { value: 'counter', icon: Hash, label: 'Counter', desc: 'Count instances with a custom unit' },
]

const WEEKDAYS = [
  { label: 'S', day: 0 },
  { label: 'M', day: 1 },
  { label: 'T', day: 2 },
  { label: 'W', day: 3 },
  { label: 'T', day: 4 },
  { label: 'F', day: 5 },
  { label: 'S', day: 6 },
]

export function TargetForm({ userId, existing, onSuccess, defaultDate }: TargetFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [scope, setScope] = useState<Scope>(existing?.scope ?? (defaultDate ? 'oneoff' : 'daily'))
  const [taskType, setTaskType] = useState<'hours' | 'checkbox' | 'counter'>(existing?.task_type ?? 'checkbox')
  const [targetValue, setTargetValue] = useState(existing?.target_value?.toString() ?? '')
  const [unit, setUnit] = useState(existing?.unit ?? '')
  const [weeklyGoal, setWeeklyGoal] = useState(existing?.weekly_goal?.toString() ?? '')
  const [color, setColor] = useState(existing?.color ?? COLORS[0])
  const [emoji, setEmoji] = useState(existing?.emoji ?? '🎯')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(existing?.priority ?? 'medium')
  const [specificDate, setSpecificDate] = useState(existing?.specific_date ?? defaultDate ?? formatDate(new Date()))
  const [recurringDays, setRecurringDays] = useState<number[]>(existing?.recurring_days ?? [])
  const [startDate, setStartDate] = useState(existing?.start_date ?? formatDate(new Date()))
  const [noEndDate, setNoEndDate] = useState(!existing?.end_date)
  const [endDate, setEndDate] = useState(existing?.end_date ?? '')

  function toggleDay(day: number) {
    setRecurringDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (scope === 'oneoff' && !specificDate) {
      setError('Please pick a date for this task.')
      setLoading(false)
      return
    }

    const payload: Record<string, unknown> = {
      user_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      scope,
      task_type: taskType,
      target_value: targetValue ? parseFloat(targetValue) : null,
      unit: unit.trim() || null,
      weekly_goal: weeklyGoal ? parseFloat(weeklyGoal) : null,
      color,
      emoji,
      priority,
      active: true,
      specific_date: scope === 'oneoff' ? specificDate : null,
      recurring_days: scope === 'daily' && recurringDays.length > 0 ? recurringDays : null,
      start_date: scope !== 'oneoff' ? startDate : null,
      end_date: scope !== 'oneoff' && !noEndDate && endDate ? endDate : null,
    }

    if (existing) {
      const { error } = await supabase.from('targets').update(payload).eq('id', existing.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('targets').insert(payload)
      if (error) { setError(error.message); setLoading(false); return }
    }

    setLoading(false)
    if (onSuccess) onSuccess()
    else router.push('/targets')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {/* Basic info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Deep Work, Exercise, Go swimming..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional notes about this task..."
            rows={2}
          />
        </div>
      </div>

      {/* Emoji + Color */}
      <div className="space-y-3">
        <Label>Icon</Label>
        <EmojiPicker value={emoji} onChange={setEmoji} title={title} />

        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-8 h-8 rounded-full transition-all ring-offset-2',
                color === c ? 'ring-2 ring-primary' : 'hover:scale-110'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Scope + Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Scope</Label>
          <Select value={scope} onValueChange={v => setScope(v as Scope)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">
                <span className="flex items-center gap-1.5"><Repeat className="h-3.5 w-3.5" /> Daily</span>
              </SelectItem>
              <SelectItem value="weekly">
                <span className="flex items-center gap-1.5"><Repeat className="h-3.5 w-3.5" /> Weekly</span>
              </SelectItem>
              <SelectItem value="oneoff">
                <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Specific date</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={v => setPriority(v as 'high' | 'medium' | 'low')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Oneoff: date picker */}
      {scope === 'oneoff' && (
        <div className="space-y-2">
          <Label htmlFor="specificDate">Date for this task</Label>
          <Input
            id="specificDate"
            type="date"
            value={specificDate}
            onChange={e => setSpecificDate(e.target.value)}
            required
          />
        </div>
      )}

      {/* Daily/Weekly: start + end date */}
      {scope !== 'oneoff' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>End date</Label>
            {noEndDate ? (
              <button
                type="button"
                onClick={() => setNoEndDate(false)}
                className="w-full h-9 rounded-md border border-dashed border-muted-foreground/40 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors px-3 text-left"
              >
                No end date (runs forever)
              </button>
            ) : (
              <div className="flex gap-1.5">
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => { setNoEndDate(true); setEndDate('') }}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 shrink-0"
                  title="Remove end date"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily: weekday recurrence chips */}
      {scope === 'daily' && (
        <div className="space-y-2">
          <Label>Repeat on days <span className="text-muted-foreground font-normal">(leave blank = every day)</span></Label>
          <div className="flex gap-1.5">
            {WEEKDAYS.map(({ label, day }) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  'w-9 h-9 rounded-full text-sm font-semibold transition-all border-2',
                  recurringDays.includes(day)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {recurringDays.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Shows only on selected days. {recurringDays.length === 7 ? 'All days selected — same as leaving blank.' : ''}
            </p>
          )}
        </div>
      )}

      {/* Task type */}
      <div className="space-y-3">
        <Label>Tracking type</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {taskTypeOptions.map(({ value, icon: Icon, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTaskType(value as 'hours' | 'checkbox' | 'counter')}
              className={cn(
                'flex flex-col gap-1 p-3 rounded-xl border-2 text-left transition-all',
                taskType === value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/40'
              )}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Goal value */}
      {(taskType === 'hours' || taskType === 'counter') && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="targetValue">
              {taskType === 'hours' ? 'Hour goal' : 'Count goal'}
            </Label>
            <Input
              id="targetValue"
              type="number"
              min="0"
              step={taskType === 'hours' ? '0.5' : '1'}
              value={targetValue}
              onChange={e => setTargetValue(e.target.value)}
              placeholder={taskType === 'hours' ? '8' : '10'}
            />
          </div>
          {taskType === 'counter' && (
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="glasses, pages, km..."
              />
            </div>
          )}
        </div>
      )}

      {scope === 'weekly' && (
        <div className="space-y-2">
          <Label htmlFor="weeklyGoal">Weekly goal total</Label>
          <Input
            id="weeklyGoal"
            type="number"
            min="0"
            step="1"
            value={weeklyGoal}
            onChange={e => setWeeklyGoal(e.target.value)}
            placeholder="e.g. 5 (days) or 40 (hours)"
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existing ? 'Save changes' : 'Create'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
