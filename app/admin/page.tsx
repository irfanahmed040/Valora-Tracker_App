import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import type { Target, DailyLog } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // Guard: only the admin account may view this page.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminEmail(user?.email)) notFound()

  // Service-role client bypasses RLS to read every user's data.
  const admin = createAdminClient()

  const [{ data: usersData }, { data: targets }, { data: logs }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('targets').select('*').order('created_at', { ascending: false }),
    admin.from('daily_logs').select('*'),
  ])

  const users = usersData?.users ?? []
  const allTargets = (targets ?? []) as Target[]
  const allLogs = (logs ?? []) as DailyLog[]

  const targetsByUser = new Map<string, Target[]>()
  for (const t of allTargets) {
    const arr = targetsByUser.get(t.user_id) ?? []
    arr.push(t)
    targetsByUser.set(t.user_id, arr)
  }
  const logsByUser = new Map<string, DailyLog[]>()
  for (const l of allLogs) {
    const arr = logsByUser.get(l.user_id) ?? []
    arr.push(l)
    logsByUser.set(l.user_id, arr)
  }

  // Admin account shown last / de-emphasized; sort real users by signup.
  const sortedUsers = [...users].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  function fmt(d?: string | null) {
    return d ? format(parseISO(d), 'dd/MM/yyyy, h:mm a') : '—'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b sticky top-0 z-10 bg-background/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="font-bold">Admin Console</span>
            <span className="text-xs text-muted-foreground ml-2">{users.length} users</span>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to app
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {sortedUsers.map(u => {
          const uTargets = targetsByUser.get(u.id) ?? []
          const uLogs = logsByUser.get(u.id) ?? []
          const completed = uLogs.filter(l => l.completed).length
          const activeCount = uTargets.filter(t => t.active && !t.deleted_at).length
          const deletedCount = uTargets.filter(t => t.deleted_at).length
          const totalHours = uLogs
            .filter(l => uTargets.find(t => t.id === l.target_id)?.task_type === 'hours')
            .reduce((s, l) => s + (l.value ?? 0), 0)

          return (
            <div key={u.id} className="rounded-xl border overflow-hidden">
              {/* User header */}
              <div className="bg-muted/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{u.email}</span>
                    {isAdminEmail(u.email) && (
                      <span className="text-[10px] font-bold uppercase bg-primary text-primary-foreground rounded px-1.5 py-0.5">admin</span>
                    )}
                    {!u.email_confirmed_at && (
                      <span className="text-[10px] font-medium bg-amber-500/15 text-amber-600 rounded px-1.5 py-0.5">unconfirmed</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">{u.id}</p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  <div>Joined {fmt(u.created_at)}</div>
                  <div>Last seen {fmt(u.last_sign_in_at)}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-border text-center">
                <Stat label="Targets" value={uTargets.length} />
                <Stat label="Active" value={activeCount} />
                <Stat label="Deleted" value={deletedCount} />
                <Stat label="Logs" value={uLogs.length} />
                <Stat label="Completed" value={completed} />
              </div>

              {/* Targets list */}
              {uTargets.length > 0 ? (
                <div className="divide-y">
                  {uTargets.map(t => {
                    const tLogs = uLogs.filter(l => l.target_id === t.id)
                    const tDone = tLogs.filter(l => l.completed).length
                    return (
                      <div key={t.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                        <span
                          className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-base"
                          style={{ backgroundColor: `${t.color}1a` }}
                        >
                          {t.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium truncate ${t.deleted_at ? 'line-through text-muted-foreground' : ''}`}>
                              {t.title}
                            </span>
                            <Tag>{t.scope}</Tag>
                            <Tag>{t.task_type}</Tag>
                            {t.deleted_at && <Tag tone="red">deleted</Tag>}
                            {!t.active && !t.deleted_at && <Tag tone="amber">paused</Tag>}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {tLogs.length} logs · {tDone} done
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="px-4 py-3 text-xs text-muted-foreground">No targets.</p>
              )}

              {totalHours > 0 && (
                <p className="px-4 py-2 text-xs text-muted-foreground border-t">
                  Total hours tracked: <span className="font-semibold text-foreground">{totalHours.toFixed(1)}h</span>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-background py-2">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: 'red' | 'amber' }) {
  const cls =
    tone === 'red'
      ? 'bg-destructive/15 text-destructive'
      : tone === 'amber'
        ? 'bg-amber-500/15 text-amber-600'
        : 'bg-muted text-muted-foreground'
  return <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 capitalize ${cls}`}>{children}</span>
}
