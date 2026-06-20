'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Smile } from 'lucide-react'

// ── Keyword → emoji suggestions ──────────────────────────────────────────────
const KEYWORD_MAP: Record<string, string[]> = {
  gym:        ['🏋️','💪','🤸','🥊','🏃','🧘','🩱','🥅','⛹️','🤼'],
  workout:    ['🏋️','💪','🤸','🏃','🥵','🩱','⚡','🔥'],
  run:        ['🏃','👟','🏅','⏱️','🌬️','🦵','🗺️'],
  yoga:       ['🧘','🌿','☮️','🕊️','🌸','💆','🌅'],
  swim:       ['🏊','🌊','💧','🐟','🤿','🏖️'],
  cycle:      ['🚴','🚵','🏆','🌄','⚡','🛞'],
  sleep:      ['😴','💤','🌙','🛏️','⭐','🌌','🌛'],
  read:       ['📚','📖','📝','🧠','💡','🎓','✍️'],
  study:      ['📚','✍️','🧠','📝','💡','🎓','📐','🔬'],
  water:      ['💧','🥤','🌊','🫧','🚰','🧃'],
  food:       ['🍎','🥗','🥦','🫐','🍳','🥑','🧃','🥕','🍇'],
  diet:       ['🥗','🍎','⚖️','🥦','🫐','🥕','🧃','🍽️'],
  meditate:   ['🧘','🌸','☮️','💆','🌿','🌅','🕊️'],
  code:       ['💻','⌨️','🖥️','🖱️','🐛','🔧','⚙️','🚀'],
  work:       ['💼','📊','📈','💻','🖊️','📋','⏰','🏢'],
  write:      ['✍️','📝','🖊️','📖','💬','📜','🖋️'],
  music:      ['🎵','🎸','🎹','🎶','🎤','🎧','🥁','🎷'],
  art:        ['🎨','🖌️','✏️','🖼️','🎭','🎪','🖍️'],
  money:      ['💰','💵','📈','💎','🏦','💳','🪙'],
  finance:    ['💰','📈','💵','💎','🏦','💳','📊'],
  prayer:     ['🙏','☪️','✝️','🕌','⛪','📿','🌙','🤲'],
  namaz:      ['🙏','🕌','🌙','☪️','📿','🤲','🕋'],
  football:   ['⚽','🏟️','👟','🥅','🏃','🧢','🏆'],
  basketball: ['🏀','🏟️','👟','🏆','⛹️','🧢'],
  tennis:     ['🎾','🏸','🏅','👟','🎯'],
  walk:       ['🚶','👟','🌳','🛤️','🗺️','🌤️'],
  health:     ['❤️','💊','🩺','🏥','🌡️','🩹','💪'],
  drink:      ['💧','🥤','☕','🧃','🍵','🧋'],
  coffee:     ['☕','🫖','🧋','⚡','🌅'],
  journal:    ['📓','✍️','📖','💭','🗒️','🖊️'],
  habit:      ['✅','🔥','⚡','💫','🏆','📈','🎯'],
  goal:       ['🎯','🏆','💫','⭐','📈','🚀','💪'],
  focus:      ['🎯','🧠','💡','⏱️','🔍','🌀','🔒'],
  learn:      ['📚','🧠','💡','🎓','✍️','📝','🔬'],
  travel:     ['✈️','🗺️','🧳','🌍','🏕️','🚂','🛳️'],
  clean:      ['🧹','🧽','✨','🪣','🧴','🫧','🏠'],
  cook:       ['🍳','👨‍🍳','🥘','🔪','🫕','🧑‍🍳','🌶️'],
  stretch:    ['🤸','🦵','💆','🧘','⚡','🌿'],
  protein:    ['🥩','🥚','🫘','💪','🏋️','🧬'],
  creatine:   ['💊','🧪','💪','🏋️','⚡','🔬'],
  vitamins:   ['💊','🌈','🧬','💉','🌿','❤️'],
  steps:      ['👟','🚶','📱','🗺️','🏃','⏱️'],
  push:       ['💪','🏋️','🤸','⚡','🔥','💥'],
  pull:       ['💪','🏋️','🧗','⚡','🔥'],
  chest:      ['💪','🏋️','⚡','🔥','👕'],
  back:       ['💪','🏋️','🧗','⚡'],
  leg:        ['🦵','🏋️','🏃','💪','⚡'],
  abs:        ['💪','🏋️','⚡','🔥','⚡'],
  boxing:     ['🥊','🥋','💪','🏋️','🔥'],
  martial:    ['🥋','🥊','⚔️','💪','🎽'],
  soccer:     ['⚽','🏟️','👟','🥅','🏃'],
  cricket:    ['🏏','⚾','🏟️','👟','🏆'],
  chess:      ['♟️','🧠','💡','🎮','🏆'],
  game:       ['🎮','🕹️','🏆','⚡','🎯'],
  garden:     ['🌱','🌿','🌸','🪴','🌻','🌾'],
  saving:     ['💰','🪙','💵','📈','🏦','💎'],
  budget:     ['📊','💰','💵','📉','📈','🧮'],
  social:     ['👥','💬','❤️','🤝','📱','🌐'],
  cold:       ['🧊','❄️','🥶','🚿','💧','⚡'],
  shower:     ['🚿','💧','✨','🧴','🫧'],
  morning:    ['🌅','☀️','☕','🌤️','⏰','🌻'],
  night:      ['🌙','⭐','💤','😴','🌌','🌛'],
}

// ── Full emoji catalogue by category ─────────────────────────────────────────
const ALL_EMOJIS: { label: string; emojis: string[] }[] = [
  { label: 'Fitness', emojis: ['🏋️','💪','🤸','🏃','🚴','🧘','🥊','🥋','🏊','⛹️','🤼','🤺','🏇','🎽','🏅','🥅','⛳','🎯','🦵','🏋','👟','🧗'] },
  { label: 'Health', emojis: ['❤️','💊','🩺','🏥','🌡️','🩹','🧬','💉','🩻','🫀','🫁','🧠','🦷','🦴','👁️','💆','🛁','🚿','🧴','🫧'] },
  { label: 'Food & Drink', emojis: ['🍎','🥗','🥦','🫐','🍳','🥑','🥕','🍇','🥚','☕','🍵','🧃','💧','🥤','🧋','🍵','🍽️','🥘','🫕','🌮','🥩','🫘'] },
  { label: 'Mind & Study', emojis: ['📚','📖','✍️','📝','🧠','💡','🎓','🔬','📐','🔭','📊','💻','⌨️','🖥️','🖱️','⚙️','🔧','🐛','🚀','🛸'] },
  { label: 'Work & Finance', emojis: ['💼','📊','📈','📉','💰','💵','💎','🪙','🏦','💳','📋','🖊️','⏰','🏢','🤝','📞','📧','🗂️','📁','🗒️'] },
  { label: 'Creative', emojis: ['🎨','🖌️','✏️','🖼️','🎭','🎪','🖍️','📸','🎬','🎵','🎸','🎹','🎶','🎤','🎧','🥁','🎷','🎺','🎻','🪗'] },
  { label: 'Nature', emojis: ['🌱','🌿','🌸','🪴','🌻','🌾','🌳','🌲','🌊','🏔️','🌅','🌄','⛅','🌙','⭐','🌌','🌛','☀️','🌈','🦋','🐝'] },
  { label: 'Goals & Habits', emojis: ['🎯','🏆','💫','⭐','📈','🔥','⚡','✅','💥','🚀','🌟','💪','🏅','🥇','🎖️','🏵️','🎗️','🎀','👑','💯'] },
  { label: 'Sports', emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🏒','🥌','🏹','🥏','🛹','🛷','⛷️','🏂','🤿','🪁','🏏','🎿'] },
  { label: 'Spiritual', emojis: ['🙏','☪️','✝️','🕌','⛪','📿','🌙','🤲','🕋','☮️','🕊️','🌸','🪷','🧿','✨','🌀','💭','🫶','❤️','🩷'] },
  { label: 'Sleep & Rest', emojis: ['😴','💤','🌙','🛏️','⭐','🌌','🌛','🌜','🧸','🛌','☁️','🫧','💆','🌿','🕯️','🌊'] },
  { label: 'People', emojis: ['👤','👥','🤝','❤️','💬','📱','🌐','👨‍👩‍👧','🫂','🫶','💑','👨‍💻','👩‍💻','🧑‍🎓','👨‍🍳','🧑‍🏫'] },
]

// ── Suggest emojis from title text ───────────────────────────────────────────
function getSuggestions(title: string): string[] {
  if (!title.trim()) return []
  const words = title.toLowerCase().split(/\s+/)
  const seen = new Set<string>()
  const results: string[] = []
  for (const word of words) {
    for (const [key, emojis] of Object.entries(KEYWORD_MAP)) {
      if (word.includes(key) || key.includes(word)) {
        for (const e of emojis) {
          if (!seen.has(e)) { seen.add(e); results.push(e) }
        }
      }
    }
  }
  return results.slice(0, 12)
}

// ── Quick picks (always visible) ─────────────────────────────────────────────
const QUICK_PICKS = ['🎯','💪','📚','🏃','🧘','💻','✍️','🎨','🎵','🌱','💧','🍎','😴','🧠','⚡','🔥','🏆','💰','🎸','📈','❤️','✅','🚀','🙏']

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  title?: string
}

export function EmojiPicker({ value, onChange, title = '' }: EmojiPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const suggestions = useMemo(() => getSuggestions(title), [title])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    const seen = new Set<string>()
    const out: string[] = []
    for (const [key, emojis] of Object.entries(KEYWORD_MAP)) {
      if (key.includes(q)) {
        for (const e of emojis) {
          if (!seen.has(e)) { seen.add(e); out.push(e) }
        }
      }
    }
    // also search category labels
    for (const cat of ALL_EMOJIS) {
      if (cat.label.toLowerCase().includes(q)) {
        for (const e of cat.emojis) {
          if (!seen.has(e)) { seen.add(e); out.push(e) }
        }
      }
    }
    return out
  }, [searchQuery])

  function EmojiBtn({ e, size = 'md' }: { e: string; size?: 'sm' | 'md' }) {
    return (
      <button
        type="button"
        onClick={() => { onChange(e); setDialogOpen(false) }}
        className={cn(
          'rounded-lg transition-all border-2 leading-none',
          size === 'md' ? 'text-xl p-2' : 'text-lg p-1.5',
          value === e ? 'border-primary bg-primary/10 scale-110' : 'border-transparent hover:border-muted hover:bg-muted/50'
        )}
      >
        {e}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      {/* Suggestions row — shown when title has keywords */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Suggested</p>
          <div className="flex flex-wrap gap-1">
            {suggestions.map(e => <EmojiBtn key={e} e={e} />)}
          </div>
        </div>
      )}

      {/* Quick picks */}
      <div className="space-y-1.5">
        {suggestions.length > 0 && <p className="text-xs text-muted-foreground font-medium">Quick picks</p>}
        <div className="flex flex-wrap gap-1">
          {QUICK_PICKS.map(e => <EmojiBtn key={e} e={e} />)}
        </div>
      </div>

      {/* More emojis dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="gap-2 w-full mt-1" />
          }
        >
          <Smile className="h-4 w-4" />
          More emojis…
        </DialogTrigger>

        <DialogContent className="max-w-sm w-full max-h-[80vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-popover z-10 px-4 pt-4 pb-3 border-b space-y-3">
            <DialogHeader>
              <DialogTitle>Choose emoji</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gym, sleep, music…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          <div className="px-4 py-3 space-y-4">
            {searchQuery ? (
              searchResults.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Results</p>
                  <div className="flex flex-wrap gap-1">
                    {searchResults.map(e => <EmojiBtn key={e} e={e} size="sm" />)}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No results for "{searchQuery}"</p>
              )
            ) : (
              ALL_EMOJIS.map(cat => (
                <div key={cat.label} className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {cat.emojis.map(e => <EmojiBtn key={e} e={e} size="sm" />)}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
