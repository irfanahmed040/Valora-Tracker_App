'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Pencil } from 'lucide-react'
import { HourLogger } from './HourLogger'
import { toast } from 'sonner'
import type { Target, DailyLog } from '@/lib/types'

const STEP = 0.5
const DEBOUNCE_MS = 600

interface InlineHourControlProps {
  target: Target
  log: DailyLog | null
  date: string
  userId: string
  color?: string
  onValueChange?: (v: number) => void
}

export function InlineHourControl({ target, log, date, userId, color = '#6D28FF', onValueChange }: InlineHourControlProps) {
  const [localValue, setLocalValue] = useState(log?.value ?? 0)
  const [loggerOpen, setLoggerOpen] = useState(false)
  const localRef = useRef(log?.value ?? 0)
  const pendingDelta = useRef(0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Sync when server refreshes props
  useEffect(() => {
    const serverVal = log?.value ?? 0
    localRef.current = serverVal
    setLocalValue(serverVal)
  }, [log?.value])

  function adjust(delta: number) {
    const newVal = Math.max(0, parseFloat((localRef.current + delta).toFixed(1)))
    localRef.current = newVal
    setLocalValue(newVal)
    onValueChange?.(newVal)
    if (delta > 0) {
      pendingDelta.current = parseFloat((pendingDelta.current + delta).toFixed(1))
    }

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => flush(newVal), DEBOUNCE_MS)
  }

  async function flush(newVal: number) {
    const isCompleted = target.target_value ? newVal >= target.target_value : false
    const delta = pendingDelta.current
    pendingDelta.current = 0

    try {
      const { data: existing } = await supabase
        .from('daily_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('target_id', target.id)
        .eq('date', date)
        .single()

      if (existing?.id) {
        await supabase
          .from('daily_logs')
          .update({ value: newVal, completed: isCompleted })
          .eq('id', existing.id)
        if (delta > 0) {
          await supabase.from('increments').insert({ log_id: existing.id, value: delta })
        }
      } else {
        const { data: newLog } = await supabase
          .from('daily_logs')
          .insert({ user_id: userId, target_id: target.id, date, value: newVal, completed: isCompleted })
          .select('id')
          .single()
        if (newLog && delta > 0) {
          await supabase.from('increments').insert({ log_id: newLog.id, value: delta })
        }
      }
      router.refresh()
    } catch {
      toast.error('Failed to save')
    }
  }

  function noSelect(e: React.MouseEvent) { e.preventDefault() }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl shrink-0 border-2 active:scale-90 transition-transform"
          style={{ borderColor: `${color}66`, color }}
          onMouseDown={noSelect}
          onClick={() => adjust(-STEP)}
          disabled={localValue === 0}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center min-w-12 select-none">
          <span className="text-lg font-bold leading-tight">{localValue}h</span>
          {target.target_value && (
            <span className="text-[10px] text-muted-foreground">/ {target.target_value}h</span>
          )}
        </div>

        <Button
          size="icon"
          className="h-9 w-9 rounded-xl shrink-0 text-white active:scale-90 transition-transform shadow-sm hover:opacity-90"
          style={{ backgroundColor: color }}
          onMouseDown={noSelect}
          onClick={() => adjust(STEP)}
        >
          <Plus className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground shrink-0"
          title="Custom amount / note"
          onClick={() => setLoggerOpen(true)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>

      <HourLogger
        open={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        target={target}
        log={log}
        date={date}
        userId={userId}
      />
    </>
  )
}
