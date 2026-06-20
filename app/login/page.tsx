'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/')
    }

    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #6D28FF 0%, #5B5EF7 20%, #4F8DFD 40%, #3FB5E8 58%, #19D3A2 76%, #00C853 100%)' }}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center">
          <Image src="/logo-dark.png" alt="Valora" width={200} height={200} className="hidden dark:block" priority />
          <Image src="/logo-light.png" alt="Valora" width={200} height={200} className="dark:hidden" priority />
        </div>

        <Card className="bg-background/80 backdrop-blur-md border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isSignUp ? 'Create account' : 'Welcome back'}</CardTitle>
            <CardDescription className="text-base">
              {isSignUp ? 'Start tracking your goals today' : 'Sign in to your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="border-foreground/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder=""
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="border-foreground/40"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  minLength={6}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              {message && (
                <p className="text-sm text-green-600 bg-green-50 dark:bg-green-950 rounded-md px-3 py-2">
                  {message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? 'Create account' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              </span>
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
