import { createClient } from '@/lib/supabase/server'
import { FitnessDateNav } from '@/components/fitness/FitnessDateNav'
import { FitnessTracker } from '@/components/fitness/FitnessTracker'
import { formatDate } from '@/lib/utils'
import { isValid, parseISO, isToday as isTodayFn } from 'date-fns'
import type { WorkoutSet } from '@/lib/types'

interface Props {
  searchParams: Promise<{ date?: string }>
}

export default async function FitnessPage({ searchParams }: Props) {
  const { date: dateParam } = await searchParams
  const date = dateParam && isValid(parseISO(dateParam)) ? dateParam : formatDate(new Date())

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: daySets }, { data: historySets }, { data: exercises }] = await Promise.all([
    supabase
      .from('workout_sets')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('created_at'),
    supabase
      .from('workout_sets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5000),
    supabase
      .from('exercises')
      .select('name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const customExercises = (exercises ?? []).map(e => e.name as string)

  return (
    <div>
      <FitnessDateNav date={date} />
      <div className="px-4 py-5 max-w-2xl mx-auto">
        <FitnessTracker
          key={date}
          userId={user.id}
          date={date}
          isToday={isTodayFn(parseISO(date))}
          initialSets={(daySets ?? []) as WorkoutSet[]}
          historySets={(historySets ?? []) as WorkoutSet[]}
          customExercises={customExercises}
        />
      </div>
    </div>
  )
}
