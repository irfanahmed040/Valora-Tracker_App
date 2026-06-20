export type TaskType = 'hours' | 'checkbox' | 'counter'
export type Scope = 'daily' | 'weekly' | 'oneoff'
export type Priority = 'high' | 'medium' | 'low'

export interface Target {
  id: string
  user_id: string
  title: string
  description?: string
  scope: Scope
  task_type: TaskType
  target_value?: number
  unit?: string
  color: string
  emoji?: string
  priority: Priority
  weekly_goal?: number
  active: boolean
  created_at: string
  specific_date?: string        // YYYY-MM-DD, only for scope='oneoff'
  recurring_days?: number[]     // 0=Sun … 6=Sat; null/empty = every day
  start_date?: string           // YYYY-MM-DD, first day target is active
  end_date?: string             // YYYY-MM-DD, last day; null = runs forever
  deleted_at?: string           // ISO timestamp; set on soft-delete, null = alive
}

export interface DailyLog {
  id: string
  user_id: string
  target_id: string
  date: string
  value: number
  completed: boolean
  notes?: string
  created_at: string
  increments?: Increment[]
}

export interface Increment {
  id: string
  log_id: string
  value: number
  note?: string
  created_at: string
}

export interface WeeklySummary {
  id: string
  user_id: string
  week_start: string
  week_end: string
  content: string
  generated_at: string
}

export interface DayStats {
  total: number
  completed: number
  percentage: number
}

export interface StreakInfo {
  current: number
  longest: number
}
