'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  hasUser: boolean
  children: React.ReactNode
}

// Routes that should render WITHOUT app chrome (no sidebar/bottom nav)
const BARE_ROUTES = ['/login', '/auth']

export function AppShell({ hasUser, children }: AppShellProps) {
  const pathname = usePathname()
  // Seed from server value, then keep in sync client-side (server read can lag)
  const [loggedIn, setLoggedIn] = useState(hasUser)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const isBare = BARE_ROUTES.some(r => pathname.startsWith(r))

  // Show chrome only when logged in AND not on a bare route
  if (!loggedIn || isBare) {
    return <main>{children}</main>
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 pt-[112px] md:pt-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
