'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, LogOut, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from './ThemeToggle'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/login')
  }

  async function exportData() {
    setExporting(true)
    try {
      const [{ data: targets }, { data: logs }, { data: increments }, { data: summaries }] = await Promise.all([
        supabase.from('targets').select('*'),
        supabase.from('daily_logs').select('*'),
        supabase.from('increments').select('*'),
        supabase.from('weekly_summaries').select('*'),
      ])
      const blob = new Blob(
        [JSON.stringify({ targets, logs, increments, summaries, exportedAt: new Date().toISOString() }, null, 2)],
        { type: 'application/json' }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `valora-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported!')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="h-9 w-9" />}
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <SheetHeader>
          <SheetTitle className="text-left text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Settings
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-1">
          {/* Theme toggle row */}
          <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-muted">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>

          {/* Export */}
          <button
            onClick={exportData}
            disabled={exporting}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted text-sm font-medium transition-colors"
          >
            {exporting
              ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              : <Download className="h-4 w-4 text-muted-foreground" />}
            Export data
          </button>

          {/* Sign out */}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted text-sm font-medium text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
