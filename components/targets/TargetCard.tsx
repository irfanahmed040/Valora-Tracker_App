'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TargetForm } from './TargetForm'
import { Clock, CheckSquare, Hash, Pencil, Trash2, EyeOff } from 'lucide-react'
import type { Target } from '@/lib/types'

interface TargetCardProps {
  target: Target
  userId: string
}

const taskTypeIcon = {
  hours: Clock,
  checkbox: CheckSquare,
  counter: Hash,
}

const priorityColor = {
  high: 'destructive' as const,
  medium: 'secondary' as const,
  low: 'outline' as const,
}

export function TargetCard({ target, userId }: TargetCardProps) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const Icon = taskTypeIcon[target.task_type]

  async function toggleActive() {
    await supabase.from('targets').update({ active: !target.active }).eq('id', target.id)
    router.refresh()
  }

  async function deleteTarget() {
    setDeleting(true)
    await supabase.from('targets').update({ active: false, deleted_at: new Date().toISOString() }).eq('id', target.id)
    router.refresh()
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="h-1" style={{ backgroundColor: target.color }} />
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-2xl leading-none mt-0.5">{target.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm truncate">{target.title}</h3>
                  {!target.active && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Paused</Badge>
                  )}
                </div>
                {target.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{target.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    <span className="capitalize">{target.task_type}</span>
                    {target.target_value && (
                      <span>· {target.target_value}{target.unit ? ` ${target.unit}` : target.task_type === 'hours' ? ' hrs' : ''}/day</span>
                    )}
                  </div>
                  <Badge variant={priorityColor[target.priority]} className="text-xs capitalize">
                    {target.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">{target.scope}</Badge>
                  {target.scope !== 'oneoff' && target.start_date && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      From {target.start_date.split('-').reverse().join('/')}
                      {target.end_date ? ` → ${target.end_date.split('-').reverse().join('/')}` : ' · forever'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={toggleActive}>
                <EyeOff className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={deleteTarget}
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit target</DialogTitle>
          </DialogHeader>
          <TargetForm userId={userId} existing={target} onSuccess={() => { setEditing(false); router.refresh() }} />
        </DialogContent>
      </Dialog>
    </>
  )
}
