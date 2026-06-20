import { createClient } from '@supabase/supabase-js'

// Service-role client — BYPASSES Row Level Security. Server-only.
// Never import this into a client component or expose the key.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
