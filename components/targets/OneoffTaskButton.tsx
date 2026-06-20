'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TargetForm } from './TargetForm'
import { CalendarPlus } from 'lucide-react'

interface OneoffTaskButtonProps {
  userId: string
  date: string
  variant?: 'default' | 'outline' | 'ghost'
}

export function OneoffTaskButton({ userId, date, variant = 'outline' }: OneoffTaskButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>
        <CalendarPlus className="h-4 w-4 mr-1" />
        One-off task
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add task for this day</DialogTitle>
          </DialogHeader>
          <TargetForm
            userId={userId}
            defaultDate={date}
            onSuccess={() => { setOpen(false); router.refresh() }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
