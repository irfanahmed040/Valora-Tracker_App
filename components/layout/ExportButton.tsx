'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ExportButton() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function exportData() {
    setLoading(true)
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
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-white/80 hover:bg-white/15 hover:text-white" onClick={exportData} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Export data
    </Button>
  )
}
