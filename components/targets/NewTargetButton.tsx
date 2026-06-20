'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TargetForm } from './TargetForm'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function NewTargetButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-1" />
        New target
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create target</DialogTitle>
          </DialogHeader>
          <TargetForm
            userId={userId}
            onSuccess={() => { setOpen(false); router.refresh() }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
