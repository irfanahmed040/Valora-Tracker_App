'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/admin'
import { CalendarRange, LayoutDashboard, Sparkles, LogOut, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'
import { ExportButton } from './ExportButton'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Targets' },
  { href: '/calendar', icon: CalendarRange, label: 'Analytics' },
  { href: '/summary', icon: Sparkles, label: 'AI Summary' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsAdmin(isAdminEmail(data.user?.email)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const todayHref = `/day/${formatDate(new Date())}`

  return (
    <aside
      className="hidden md:flex flex-col w-60 min-h-screen px-3 py-6 gap-1 fixed left-0 top-0 z-40 text-white"
      style={{ background: 'linear-gradient(160deg, #6D28FF 0%, #5B5EF7 22%, #4F8DFD 42%, #3FB5E8 60%, #19D3A2 80%, #00C853 100%)' }}
    >
      <Link href={todayHref} className="flex items-center px-3 py-2 mb-4">
        <Image src="/logo-dark.png" alt="Valora" width={96} height={96} className="hidden dark:block" priority />
        <Image src="/logo-light.png" alt="Valora" width={96} height={96} className="dark:hidden" priority />
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/'
            ? pathname === '/' || pathname.startsWith('/day')
            : href === '/calendar'
              ? pathname.startsWith('/calendar') || pathname.startsWith('/week') || pathname.startsWith('/month')
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href === '/' ? todayHref : href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/25 text-white backdrop-blur-sm shadow-sm'
                  : 'text-white/75 hover:bg-white/15 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith('/admin')
                ? 'bg-white/25 text-white backdrop-blur-sm shadow-sm'
                : 'text-white/75 hover:bg-white/15 hover:text-white'
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin
          </Link>
        )}
      </nav>

      <div className="border-t border-white/20 pt-3 space-y-1 mt-auto">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="text-xs text-white/70 px-2">Theme</span>
          <ThemeToggle />
        </div>
        <ExportButton />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-white/80 hover:bg-white/15 hover:text-white"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
