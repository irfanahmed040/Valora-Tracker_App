'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dumbbell, Minus, Plus, X, Zap, Repeat2, ChevronDown, Pencil, Check, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { FAMOUS_EXERCISES } from '@/lib/exercises'
import { ExercisePicker } from './ExercisePicker'
import type { WorkoutSet } from '@/lib/types'

const ACCENT = '#6D28FF'

let tempCounter = 0
function makeTempSet(userId: string, date: string, exercise: string, reps: number, weight: number | null): WorkoutSet {
  return {
    id: `temp-${++tempCounter}`,
    user_id: userId,
    date,
    exercise,
    reps,
    weight,
    created_at: new Date().toISOString(),
  }
}

// PR ranking: higher weight wins; tie → more reps; tie → more recent
function isBetter(a: WorkoutSet, b: WorkoutSet): boolean {
  const wa = a.weight ?? 0
  const wb = b.weight ?? 0
  if (wa !== wb) return wa > wb
  if (a.reps !== b.reps) return a.reps > b.reps
  return a.created_at > b.created_at
}

interface FitnessTrackerProps {
  userId: string
  date: string
  isToday?: boolean
  initialSets: WorkoutSet[]      // today's sets
  historySets: WorkoutSet[]      // all sets cross-date, newest first
  customExercises: string[]      // user-added exercise names
}

export function FitnessTracker({ userId, date, isToday = true, initialSets, historySets, customExercises }: FitnessTrackerProps) {
  const supabase = createClient()

  const [sets, setSets] = useState<WorkoutSet[]>(initialSets)
  const [customList, setCustomList] = useState<string[]>(customExercises)
  // Picked exercises for this session (seed with any already logged today)
  const [picked, setPicked] = useState<string[]>(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const s of initialSets) {
      if (!seen.has(s.exercise)) { seen.add(s.exercise); out.push(s.exercise) }
    }
    return out
  })
  const [active, setActive] = useState<string | null>(null)
  const [reps, setReps] = useState(10)
  const [weight, setWeight] = useState<number | null>(null) // null = bodyweight
  const [saving, setSaving] = useState(false)

  // Inline edit state for previously-logged sets
  const [editId, setEditId] = useState<string | null>(null)
  const [editReps, setEditReps] = useState(0)
  const [editWeight, setEditWeight] = useState<number | null>(null)

  // Full suggestion pool: custom + history + famous (deduped, case-insensitive)
  const pool = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    const push = (name: string) => {
      const k = name.toLowerCase()
      if (!seen.has(k)) { seen.add(k); out.push(name) }
    }
    customList.forEach(push)
    historySets.forEach(s => push(s.exercise))
    sets.forEach(s => push(s.exercise))
    FAMOUS_EXERCISES.forEach(push)
    return out
  }, [customList, historySets, sets])

  // PR set id per exercise, across full history (live today + past days)
  const { prIdByExercise, prBestByExercise } = useMemo(() => {
    const all = [...historySets.filter(s => s.date !== date), ...sets]
    const best = new Map<string, WorkoutSet>()
    for (const s of all) {
      const cur = best.get(s.exercise)
      if (!cur || isBetter(s, cur)) best.set(s.exercise, s)
    }
    const ids = new Map<string, string>()
    best.forEach((s, ex) => ids.set(ex, s.id))
    return { prIdByExercise: ids, prBestByExercise: best }
  }, [historySets, sets, date])

  // Last set for an exercise (today first, else history) — for prefill
  function lastSetFor(exercise: string): WorkoutSet | undefined {
    for (let i = sets.length - 1; i >= 0; i--) {
      if (sets[i].exercise === exercise) return sets[i]
    }
    return historySets.find(s => s.exercise === exercise)
  }

  function selectExercise(name: string) {
    const last = lastSetFor(name)
    setReps(last?.reps ?? 10)
    setWeight(last?.weight ?? null)
    setPicked(prev => (prev.includes(name) ? prev : [...prev, name]))
    setActive(name)
  }

  function removePicked(name: string) {
    setPicked(prev => prev.filter(n => n !== name))
    if (active === name) setActive(null)
  }

  async function addNewExercise(name: string) {
    const clean = name.trim()
    if (!clean) return
    // optimistic add to local pool + select
    if (!customList.some(n => n.toLowerCase() === clean.toLowerCase())) {
      setCustomList(prev => [clean, ...prev])
    }
    selectExercise(clean)
    // persist (ignore duplicate-key errors — already saved)
    const { error } = await supabase.from('exercises').insert({ user_id: userId, name: clean })
    if (error && error.code !== '23505') {
      toast.error('Failed to save exercise')
    }
  }

  async function logSet(exercise: string, r: number, w: number | null) {
    const temp = makeTempSet(userId, date, exercise, r, w)
    setSets(prev => [...prev, temp])
    setSaving(true)
    const { data, error } = await supabase
      .from('workout_sets')
      .insert({ user_id: userId, date, exercise, reps: r, weight: w })
      .select()
      .single()
    setSaving(false)
    if (error || !data) {
      setSets(prev => prev.filter(s => s.id !== temp.id))
      toast.error('Failed to log set')
    } else {
      setSets(prev => prev.map(s => (s.id === temp.id ? (data as WorkoutSet) : s)))
    }
  }

  async function deleteSet(id: string) {
    const removed = sets.find(s => s.id === id)
    setSets(prev => prev.filter(s => s.id !== id))
    if (editId === id) setEditId(null)
    const { error } = await supabase.from('workout_sets').delete().eq('id', id)
    if (error && removed) {
      setSets(prev => [...prev, removed])
      toast.error('Failed to delete set')
    }
  }

  function startEdit(s: WorkoutSet) {
    setEditId(s.id)
    setEditReps(s.reps)
    setEditWeight(s.weight ?? null)
  }

  async function saveEdit(id: string) {
    const prev = sets.find(s => s.id === id)
    if (!prev) return
    const r = Math.max(1, Math.round(editReps))
    const w = editWeight === null || editWeight <= 0 ? null : +editWeight.toFixed(1)
    setSets(cur => cur.map(s => (s.id === id ? { ...s, reps: r, weight: w } : s)))
    setEditId(null)
    const { error } = await supabase.from('workout_sets').update({ reps: r, weight: w }).eq('id', id)
    if (error) {
      setSets(cur => cur.map(s => (s.id === id ? prev : s)))
      toast.error('Failed to update set')
    }
  }

  // Group today's sets by exercise, first-logged order
  const groups = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>()
    for (const s of sets) {
      const arr = map.get(s.exercise)
      if (arr) arr.push(s)
      else map.set(s.exercise, [s])
    }
    return Array.from(map.entries())
  }, [sets])

  const totalSets = sets.length
  const totalReps = sets.reduce((a, s) => a + s.reps, 0)
  const volume = Math.round(sets.reduce((a, s) => a + s.reps * (s.weight ?? 0), 0))

  const selectedPR = active ? prBestByExercise.get(active) : undefined

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 stagger-children">
        <StatTile label="Sets" value={totalSets} />
        <StatTile label="Reps" value={totalReps} />
        <StatTile label="Volume (kg)" value={volume} />
      </div>

      <ExercisePicker
        pool={pool}
        onSelect={selectExercise}
        onAddNew={addNewExercise}
      />

      {/* Selected exercises — switch between them, remove */}
      {picked.length > 0 && (
        <div className="space-y-2 animate-rise-in">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected exercises</h2>
          <div className="flex flex-wrap gap-2">
            {picked.map(name => {
              const isActive = active === name
              return (
                <div
                  key={name}
                  className={cn(
                    'group flex items-center rounded-full border transition-colors overflow-hidden',
                    isActive
                      ? 'border-transparent text-white shadow-md'
                      : 'bg-card border-foreground/15 text-foreground/80 hover:border-foreground/30'
                  )}
                  style={isActive ? { background: `linear-gradient(135deg, ${ACCENT}, #4F8DFD)` } : undefined}
                >
                  <button
                    onClick={() => (isActive ? setActive(null) : selectExercise(name))}
                    className="press-spring pl-4 pr-2 h-9 text-sm font-medium"
                  >
                    {name}
                  </button>
                  <button
                    onClick={() => removePicked(name)}
                    className={cn(
                      'h-9 px-2 flex items-center transition-colors',
                      isActive ? 'text-white/70 hover:text-white' : 'text-muted-foreground/50 hover:text-destructive'
                    )}
                    title="Remove from list"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Log panel */}
      {active && (
        <Card className="animate-rise-in relative isolate overflow-hidden rounded-2xl border border-foreground/10 bg-card/70 backdrop-blur-sm">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{ background: `linear-gradient(135deg, ${ACCENT}22 0%, ${ACCENT}08 40%, transparent 70%)` }}
          />
          <CardContent className="pt-4 pb-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold flex items-center gap-2 min-w-0">
                <Dumbbell className="h-4 w-4 shrink-0" style={{ color: ACCENT }} />
                <span className="truncate">{active}</span>
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                {selectedPR && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-0.5 bg-amber-500/15 text-amber-500">
                    <Trophy className="h-3 w-3" />
                    PR {selectedPR.reps}×{selectedPR.weight != null ? `${selectedPR.weight}kg` : 'BW'}
                  </span>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setActive(null)}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-around gap-4">
              <Stepper
                label="Reps"
                value={reps}
                min={1}
                step={1}
                onChange={n => setReps(n === null ? 1 : Math.max(1, Math.round(n)))}
              />
              <Stepper
                label="Weight"
                value={weight}
                min={0}
                step={2.5}
                allowEmpty
                emptyLabel="BW"
                sub={weight === null ? 'bodyweight' : 'kg'}
                onChange={n => setWeight(n === null || n <= 0 ? null : +n.toFixed(1))}
              />
            </div>

            <button
              disabled={saving}
              onClick={() => logSet(active, reps, weight)}
              className="press-spring w-full h-12 rounded-xl font-semibold text-white text-base flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #4F8DFD)`, boxShadow: `0 4px 16px ${ACCENT}55` }}
            >
              <Zap className="h-5 w-5" />
              Log set
            </button>
          </CardContent>
        </Card>
      )}

      {/* Today's sets grouped by exercise */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center animate-rise-in">
          <Dumbbell className="h-12 w-12 text-muted-foreground/40 animate-wiggle" />
          <div>
            <p className="font-medium">{isToday ? 'No sets logged today' : 'No sets logged this day'}</p>
            <p className="text-sm text-muted-foreground">Search an exercise, then log your first set</p>
          </div>
        </div>
      ) : (
        <section className="space-y-3 stagger-children">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{isToday ? 'Today’s workout' : 'Workout'}</h2>
          {groups.map(([exercise, exSets]) => {
            const last = exSets[exSets.length - 1]
            const prId = prIdByExercise.get(exercise)
            return (
              <Card key={exercise} className="rounded-2xl border border-foreground/10 bg-card/70 backdrop-blur-sm overflow-hidden">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[15px]">{exercise}</h3>
                      <span
                        className="text-[11px] font-bold rounded-full px-2 py-0.5"
                        style={{ color: ACCENT, background: `${ACCENT}1a` }}
                      >
                        {exSets.length} {exSets.length === 1 ? 'set' : 'sets'}
                      </span>
                    </div>
                    <button
                      disabled={saving}
                      onClick={() => logSet(exercise, last.reps, last.weight ?? null)}
                      className="press-spring flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5 disabled:opacity-60"
                      style={{ color: ACCENT, background: `${ACCENT}14` }}
                      title="Repeat last set"
                    >
                      <Repeat2 className="h-3.5 w-3.5" />
                      Repeat
                    </button>
                  </div>

                  <div className="space-y-1">
                    {exSets.map((s, i) => {
                      const isPR = s.id === prId
                      const editing = editId === s.id
                      return (
                        <div
                          key={s.id}
                          className={cn(
                            'animate-slide-in-left group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors',
                            isPR ? 'bg-amber-500/10 ring-1 ring-amber-500/40' : 'hover:bg-foreground/5'
                          )}
                        >
                          <span
                            className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold"
                            style={
                              isPR
                                ? { color: '#fff', background: 'linear-gradient(135deg,#f59e0b,#f97316)' }
                                : { color: ACCENT, background: `${ACCENT}14` }
                            }
                          >
                            {isPR ? <Trophy className="h-3 w-3" /> : i + 1}
                          </span>

                          {editing ? (
                            <div className="flex items-center gap-1.5 flex-1">
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={String(editReps)}
                                onChange={e => setEditReps(parseInt(e.target.value) || 0)}
                                className="h-8 w-14 text-center text-sm"
                              />
                              <span className="text-xs text-muted-foreground">×</span>
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={editWeight === null ? '' : String(editWeight)}
                                placeholder="BW"
                                onChange={e => {
                                  const v = e.target.value.trim()
                                  setEditWeight(v === '' ? null : (parseFloat(v) || 0))
                                }}
                                className="h-8 w-16 text-center text-sm"
                              />
                              <span className="text-xs text-muted-foreground">kg</span>
                              <button
                                onClick={() => saveEdit(s.id)}
                                className="ml-auto text-green-500 p-1 press-spring"
                                title="Save"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditId(null)}
                                className="text-muted-foreground p-1 press-spring"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-medium tabular-nums">
                                {s.reps} reps
                                <span className="text-muted-foreground font-normal">
                                  {' '}× {s.weight != null ? `${s.weight} kg` : 'BW'}
                                </span>
                              </span>
                              {isPR && (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-500">PR</span>
                              )}
                              <div className="ml-auto flex items-center gap-0.5">
                                <button
                                  onClick={() => startEdit(s)}
                                  className="opacity-40 md:opacity-0 md:group-hover:opacity-60 hover:!opacity-100 text-muted-foreground transition-opacity p-1"
                                  title="Edit set"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteSet(s.id)}
                                  className="opacity-40 md:opacity-0 md:group-hover:opacity-60 hover:!opacity-100 text-destructive transition-opacity p-1"
                                  title="Delete set"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-2xl border border-foreground/10 bg-card/70 backdrop-blur-sm">
      <CardContent className="py-3 text-center">
        <div key={value} className="text-2xl font-bold tabular-nums animate-number-pop">{value}</div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      </CardContent>
    </Card>
  )
}

function Stepper({
  label, value, min, step, sub, allowEmpty = false, emptyLabel = '', onChange,
}: {
  label: string
  value: number | null
  min: number
  step: number
  sub?: string
  allowEmpty?: boolean
  emptyLabel?: string
  onChange: (n: number | null) => void
}) {
  // Local text buffer so user can freely clear/type; commit on change/blur
  const [text, setText] = useState<string>(value === null ? '' : String(value))
  const [editing, setEditing] = useState(false)

  // Sync buffer to external value when not actively typing (render-time, no effect)
  const [lastValue, setLastValue] = useState(value)
  if (!editing && value !== lastValue) {
    setLastValue(value)
    setText(value === null ? '' : String(value))
  }

  function commit(raw: string) {
    const trimmed = raw.trim()
    if (trimmed === '') {
      onChange(allowEmpty ? null : min)
      return
    }
    const n = parseFloat(trimmed)
    if (isNaN(n)) {
      onChange(allowEmpty ? null : min)
      return
    }
    onChange(Math.max(min, n))
  }

  function bump(delta: number) {
    const base = value ?? (delta > 0 ? 0 : min)
    const next = +(base + delta).toFixed(2)
    if (allowEmpty && next <= min) onChange(null)
    else onChange(Math.max(min, next))
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl border-2 press-spring"
          style={{ borderColor: `${ACCENT}55`, color: ACCENT }}
          onMouseDown={e => e.preventDefault()}
          onClick={() => bump(-step)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="w-16 text-center">
          <Input
            type="text"
            inputMode="decimal"
            value={text}
            placeholder={allowEmpty ? emptyLabel : String(min)}
            onFocus={e => { setEditing(true); e.target.select() }}
            onChange={e => { setText(e.target.value); commit(e.target.value) }}
            onBlur={() => setEditing(false)}
            className="h-10 text-center text-2xl font-bold tabular-nums px-1 border-transparent bg-transparent focus-visible:bg-card focus-visible:border-input rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {sub && <div className="text-[10px] text-muted-foreground -mt-0.5">{sub}</div>}
        </div>
        <Button
          size="icon"
          className="h-10 w-10 rounded-xl text-white press-spring shadow-sm hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
          onMouseDown={e => e.preventDefault()}
          onClick={() => bump(step)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
