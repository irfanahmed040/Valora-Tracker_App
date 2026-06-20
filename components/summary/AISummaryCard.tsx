'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import type { WeeklySummary } from '@/lib/types'
import { format, parseISO } from 'date-fns'

interface AISummaryCardProps {
  start: string
  end: string
  periodType: 'week' | 'month'
  hasData: boolean
  existing?: WeeklySummary
}

export function AISummaryCard({ start, end, periodType, hasData, existing }: AISummaryCardProps) {
  const [summary, setSummary] = useState<WeeklySummary | undefined>(existing)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart: start, weekEnd: end, periodType }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: '' }))
        throw new Error(error || 'Generation failed')
      }
      const { summary: s } = await res.json()
      setSummary(s)
      toast.success('AI summary generated!')
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : 'Failed to generate summary.')
    } finally {
      setLoading(false)
    }
  }

  const weekLabel = `${format(parseISO(start), 'dd/MM/yyyy')} – ${format(parseISO(end), 'dd/MM/yyyy')}`

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              {weekLabel}
            </CardTitle>
            {summary && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Generated {format(parseISO(summary.generated_at), 'dd/MM/yyyy, h:mm a')}
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant={summary ? 'outline' : 'default'}
            onClick={generate}
            disabled={loading || (!hasData && !summary)}
          >
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Generating…</>
              : summary
                ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Regenerate</>
                : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate summary</>
            }
          </Button>
        </div>
      </CardHeader>

      {summary && (
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{summary.content}</ReactMarkdown>
          </div>
        </CardContent>
      )}

      {!summary && !loading && (
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {hasData
              ? `No summary yet. Click "Generate summary" to get an AI review of this ${periodType}.`
              : `No activity this ${periodType} — nothing to summarize.`}
          </p>
        </CardContent>
      )}
    </Card>
  )
}
