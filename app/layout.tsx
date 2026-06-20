import type { Metadata, Viewport } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Valora',
  description: 'Track. Achieve. Become more.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className={`${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppShell hasUser={!!user}>{children}</AppShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
