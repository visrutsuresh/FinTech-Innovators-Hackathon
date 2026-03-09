import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Browser-side Supabase client — safe to import in client components.
// The placeholder values prevent build-time crashes; real values are required at runtime.
export const supabase = createClient(url, key)
