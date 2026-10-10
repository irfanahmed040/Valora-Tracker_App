'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export function ClearFitnessButton({ userId, setCount }: { userId: string; setCount: number }) {
  const [open, setOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const router = useRouter()

  async function clearAll() {
    setClearing(true)
    const supabase = createClient()
    const { error } = await supabase.from('workout_sets').delete().eq('user_id', userId)
    setClearing(false)
    if (error) {
      toast.error('Failed to clear fitness data')
      return
    }
    toast.success('All fitness data cleared')
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10" />}
      >
        <Trash2 className="h-4 w-4" />
        Clear data
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto mb-1 h-11 w-11 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <DialogTitle className="text-center">Clear all fitness data?</DialogTitle>
          <DialogDescription className="text-center">
            Permanently deletes every workout set across all days
            {setCount > 0 ? ` (${setCount} in this period)` : ''}. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={clearing} />}>
            Cancel
          </DialogClose>
          <Button variant="destructive" onClick={clearAll} disabled={clearing} className="gap-1.5">
            {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete everything
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
