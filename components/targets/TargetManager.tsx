'use client'

import { Settings2, X } from 'lucide-react'
import { TargetCard } from './TargetCard'
import { NewTargetButton } from './NewTargetButton'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Target } from '@/lib/types'

interface TargetManagerProps {
  activeTargets: Target[]
  pausedTargets: Target[]
  userId: string
}

export function TargetManager({ activeTargets, pausedTargets, userId }: TargetManagerProps) {
  const countLabel = [
    `${activeTargets.length} active`,
    pausedTargets.length > 0 ? `${pausedTargets.length} paused` : null,
  ].filter(Boolean).join(' · ')

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          />
        }
      >
        <Settings2 className="h-4 w-4" />
        Manage targets
        <span className="text-xs text-muted-foreground font-normal">({countLabel})</span>
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="max-w-lg w-full max-h-[80vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-popover z-10 px-5 pt-5 pb-3 border-b">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-base">Manage targets</DialogTitle>
              <DialogClose
                render={<Button variant="ghost" size="sm" className="gap-1 -mr-2" />}
              >
                <X className="h-4 w-4" />
                Back
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="mt-3 flex justify-end">
            <NewTargetButton userId={userId} />
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {activeTargets.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active</p>
              {activeTargets.map(t => (
                <TargetCard key={t.id} target={t} userId={userId} />
              ))}
            </div>
          )}

          {pausedTargets.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paused</p>
              {pausedTargets.map(t => (
                <TargetCard key={t.id} target={t} userId={userId} />
              ))}
            </div>
          )}

          {activeTargets.length === 0 && pausedTargets.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No targets yet. Create your first one above.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
