'use client'

import { useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Plus, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCENT = '#6D28FF'

interface ExercisePickerProps {
  pool: string[]        // full suggestion pool (custom + history + famous), deduped
  onSelect: (name: string) => void
  onAddNew: (name: string) => void
}

export function ExercisePicker({ pool, onSelect, onAddNew }: ExercisePickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const q = query.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!q) return pool
    const starts: string[] = []
    const contains: string[] = []
    for (const name of pool) {
      const l = name.toLowerCase()
      if (l.startsWith(q)) starts.push(name)
      else if (l.includes(q)) contains.push(name)
    }
    return [...starts, ...contains]
  }, [pool, q])

  const exactExists = q.length > 0 && pool.some(n => n.toLowerCase() === q)
  const canAdd = q.length > 0 && !exactExists

  function choose(name: string) {
    onSelect(name)
    setQuery('')
    setOpen(false)
  }

  function add() {
    const name = query.trim()
    if (!name) return
    onAddNew(name)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className={cn('space-y-2 animate-rise-in', open && 'relative z-50')}>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pick exercise</h2>

      {/* Search combobox */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          placeholder="Search or add an exercise…"
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150) }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (matches.length > 0 && !canAdd) choose(matches[0])
              else if (canAdd) add()
            }
            if (e.key === 'Escape') setOpen(false)
          }}
          className="h-11 pl-9 pr-3 rounded-xl"
        />

        {open && (matches.length > 0 || canAdd) && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-foreground/10 bg-popover shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto animate-rise-in">
            {canAdd && (
              <button
                type="button"
                // pointer-down fires before the input's blur closes the menu
                onPointerDown={e => { e.preventDefault(); add() }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors text-left"
              >
                <span
                  className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #4F8DFD)` }}
                >
                  <Plus className="h-3.5 w-3.5 text-white" />
                </span>
                Add “{query.trim()}”
              </button>
            )}
            {matches.map(name => (
              <button
                key={name}
                type="button"
                onPointerDown={e => { e.preventDefault(); choose(name) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left"
              >
                <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
