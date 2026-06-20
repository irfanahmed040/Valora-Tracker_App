'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus, Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Target, DailyLog } from '@/lib/types'

const DEBOUNCE_MS = 600

interface CounterControlProps {
  target: Target
  log: DailyLog | null
  date: string
  userId: string
  color?: string
}

export function CounterControl({ target, log, date, userId, color = '#6D28FF' }: CounterControlProps) {
  const [localValue, setLocalValue] = useState(log?.value ?? 0)
  const [customOpen, setCustomOpen] = useState(false)
  const [customVal, setCustomVal] = useState('')
  const localRef = useRef(log?.value ?? 0)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const serverVal = log?.value ?? 0
    localRef.current = serverVal
    setLocalValue(serverVal)
  }, [log?.value])

  function adjust(delta: number) {
    const newVal = Math.max(0, localRef.current + delta)
    localRef.current = newVal
    setLocalValue(newVal)

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => flush(newVal), DEBOUNCE_MS)
  }

  async function flush(newVal: number) {
    const isCompleted = target.target_value ? newVal >= target.target_value : newVal > 0
    const { error } = await supabase
      .from('daily_logs')
      .upsert(
        { user_id: userId, target_id: target.id, date, value: newVal, completed: isCompleted },
        { onConflict: 'user_id,target_id,date' }
      )
    if (error) toast.error('Failed to save')
    else router.refresh()
  }

  function openCustom() {
    setCustomVal(String(localValue))
    setCustomOpen(true)
    setTimeout(() => inputRef.current?.select(), 50)
  }

  function saveCustom() {
    const n = parseFloat(customVal)
    if (!isNaN(n) && n >= 0) {
      localRef.current = n
      setLocalValue(n)
      flush(n)
    }
    setCustomOpen(false)
  }

  function noSelect(e: React.MouseEvent) { e.preventDefault() }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-xl shrink-0 border-2 active:scale-90 transition-transform"
        style={{ borderColor: `${color}66`, color }}
        onMouseDown={noSelect}
        onClick={() => adjust(-1)}
        disabled={localValue === 0}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <span className="text-xl font-bold min-w-9 text-center select-none">{localValue}</span>

      <Button
        size="icon"
        className="h-9 w-9 rounded-xl shrink-0 text-white active:scale-90 transition-transform shadow-sm hover:opacity-90"
        style={{ backgroundColor: color }}
        onMouseDown={noSelect}
        onClick={() => adjust(1)}
      >
        <Plus className="h-4 w-4" />
      </Button>

      {target.unit && (
        <span className="text-sm text-muted-foreground">{target.unit}</span>
      )}

      {!customOpen ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground shrink-0"
          title="Set custom value"
          onClick={openCustom}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      ) : (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            type="number"
            min="0"
            step="1"
            value={customVal}
            onChange={e => setCustomVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') saveCustom()
              if (e.key === 'Escape') setCustomOpen(false)
            }}
            className="h-8 w-20 text-sm"
          />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 shrink-0" onClick={saveCustom}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground shrink-0" onClick={() => setCustomOpen(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
