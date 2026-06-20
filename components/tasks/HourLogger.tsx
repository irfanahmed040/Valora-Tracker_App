'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Target, DailyLog } from '@/lib/types'

interface HourLoggerProps {
  open: boolean
  onClose: () => void
  target: Target
  log: DailyLog | null
  date: string
  userId: string
}

const PRESETS = [0.5, 1, 2, 4]

export function HourLogger({ open, onClose, target, log, date, userId }: HourLoggerProps) {
  const [custom, setCustom] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function addIncrement(value: number) {
    setLoading(true)
    try {
      let logId = log?.id

      if (!logId) {
        const { data, error } = await supabase
          .from('daily_logs')
          .upsert({
            user_id: userId,
            target_id: target.id,
            date,
            value: 0,
            completed: false,
          }, { onConflict: 'user_id,target_id,date' })
          .select('id')
          .single()

        if (error) throw error
        logId = data.id
      }

      const { error: incError } = await supabase.from('increments').insert({
        log_id: logId,
        value,
        note: note.trim() || null,
      })
      if (incError) throw incError

      const newTotal = (log?.value ?? 0) + value
      const isCompleted = target.target_value ? newTotal >= target.target_value : false

      await supabase
        .from('daily_logs')
        .update({ value: newTotal, completed: isCompleted })
        .eq('id', logId)

      toast.success(`+${value}h logged for ${target.title}`)
      setCustom('')
      setNote('')
      onClose()
      router.refresh()
    } catch (err) {
      toast.error('Failed to log hours')
    } finally {
      setLoading(false)
    }
  }

  function handleCustom() {
    const val = parseFloat(custom)
    if (!val || val <= 0) return
    addIncrement(val)
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <span>{target.emoji}</span>
            <span>Log hours — {target.title}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Quick add</p>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map(p => (
                <Button
                  key={p}
                  variant="outline"
                  size="lg"
                  onClick={() => addIncrement(p)}
                  disabled={loading}
                  className="flex flex-col gap-0.5 h-14"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-sm font-semibold">{p}h</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom amount (hours)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="e.g. 1.5"
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustom()}
              />
              <Button onClick={handleCustom} disabled={loading || !custom}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea
              placeholder="What did you work on?"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
            />
          </div>

          {log && log.value > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {log.value}h logged today
              {target.target_value ? ` · goal: ${target.target_value}h` : ''}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
