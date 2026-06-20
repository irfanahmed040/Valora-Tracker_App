'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CalendarRange, Sparkles, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

export function CustomSummaryCard() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const valid = start && end && start <= end

  async function generate() {
    if (!valid) {
      toast.error('Pick a valid start and end date.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart: start, weekEnd: end, periodType: 'custom' }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: '' }))
        throw new Error(error || 'Generation failed')
      }
      const { summary } = await res.json()
      setContent(summary.content)
      toast.success('Custom summary generated!')
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : 'Failed to generate summary.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="h-4 w-4 text-primary" />
          Custom range summary
        </CardTitle>
        <div className="flex items-end gap-3 flex-wrap mt-2">
          <div className="space-y-1">
            <Label htmlFor="custom-start" className="text-xs">From</Label>
            <Input
              id="custom-start"
              type="date"
              value={start}
              max={end || undefined}
              onChange={e => setStart(e.target.value)}
              className="h-9 w-40"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="custom-end" className="text-xs">To</Label>
            <Input
              id="custom-end"
              type="date"
              value={end}
              min={start || undefined}
              onChange={e => setEnd(e.target.value)}
              className="h-9 w-40"
            />
          </div>
          <Button size="sm" onClick={generate} disabled={loading || !valid}>
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generating…</>
              : content
                ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Regenerate</>
                : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate</>
            }
          </Button>
        </div>
      </CardHeader>

      {content && (
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
