import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO } from 'date-fns'
import type { DailyLog, Target } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM-dd')
}

export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  return format(d, 'EEEE, MMM d')
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export function getWeekRange(date: Date): { weekStart: string; weekEnd: string } {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return { weekStart: formatDate(start), weekEnd: formatDate(end) }
}

export function getMonthDays(date: Date): Date[] {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return eachDayOfInterval({ start, end })
}

export function getMonthRange(date: Date): { monthStart: string; monthEnd: string } {
  return {
    monthStart: formatDate(startOfMonth(date)),
    monthEnd: formatDate(endOfMonth(date)),
  }
}

export function calcCompletionPercent(log: DailyLog, target: Target): number {
  if (target.task_type === 'checkbox') return log.completed ? 100 : 0
  if (!target.target_value || target.target_value === 0) return log.completed ? 100 : 0
  return Math.min(100, Math.round((log.value / target.target_value) * 100))
}

export function calcStreak(logs: DailyLog[]): number {
  if (!logs.length) return 0
  const sorted = [...logs]
    .filter(l => l.completed)
    .sort((a, b) => b.date.localeCompare(a.date))
  if (!sorted.length) return 0

  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISO(sorted[i - 1].date)
    const curr = parseISO(sorted[i].date)
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) streak++
    else break
  }
  return streak
}

export const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
]

export const EMOJIS = [
  '🎯', '💪', '📚', '🏃', '🧘', '💻', '✍️', '🎨',
  '🎵', '🌱', '💧', '🍎', '😴', '🧠', '⚡', '🔥',
]
