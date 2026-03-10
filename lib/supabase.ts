import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Browser-side Supabase client — safe to import in client components.
// Use sessionStorage so closing the tab logs the user out (session is cleared by the browser).
// On the server (SSR) there is no window, so we omit storage and Supabase uses its default.
export const supabase = createClient(url, key, {
  auth: {
    ...(typeof window !== 'undefined' && { storage: window.sessionStorage }),
  },
})
