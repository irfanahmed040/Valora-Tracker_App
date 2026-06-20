'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, formatDate } from '@/lib/utils'
import { CalendarRange, LayoutDashboard, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { MobileMenu } from './MobileMenu'

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Targets' },
  { href: '/calendar', icon: CalendarRange, label: 'Analytics' },
  { href: '/summary', icon: Sparkles, label: 'Summary' },
]

export function BottomNav() {
  const pathname = usePathname()
  const todayHref = `/day/${formatDate(new Date())}`

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex flex-col">
      {/* Row 1: hamburger left · logo center — theme background */}
      <div className="relative flex items-center justify-center h-16 bg-background border-b overflow-hidden">
        <div className="absolute left-2">
          <MobileMenu />
        </div>
        <Link href={todayHref}>
          <Image src="/logo-dark-mob.png" alt="Valora" width={160} height={56} className="hidden dark:block" priority />
          <Image src="/logo-light-mob.png" alt="Valora" width={160} height={56} className="dark:hidden" priority />
        </Link>
      </div>

      {/* Row 2: nav items — gradient */}
      <div
        className="flex items-center justify-around h-12 text-white"
        style={{ background: 'linear-gradient(90deg, #6D28FF 0%, #4F8DFD 40%, #3FB5E8 65%, #00C853 100%)' }}
      >
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
                'flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg text-xs font-medium transition-colors',
                isActive ? 'bg-white/25 text-white backdrop-blur-sm' : 'text-white/75'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
