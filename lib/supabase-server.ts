import { createClient } from '@supabase/supabase-js'

// SERVER-ONLY admin client — never import in client components.
// Uses the service role key which bypasses Row Level Security.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
