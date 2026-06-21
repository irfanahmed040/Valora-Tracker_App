import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { NextResponse } from 'next/server'

// Read-only: returns one user's targets + logs in a date range. Admin only.
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  if (!userId || !start || !end) {
    return NextResponse.json({ error: 'userId, start, end required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const [{ data: targets }, { data: logs }] = await Promise.all([
    admin.from('targets').select('*').eq('user_id', userId)
      .or('active.eq.true,deleted_at.not.is.null').order('created_at'),
    admin.from('daily_logs').select('*').eq('user_id', userId).gte('date', start).lte('date', end),
  ])

  return NextResponse.json({ targets: targets ?? [], logs: logs ?? [] })
}
