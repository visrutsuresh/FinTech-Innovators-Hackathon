import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// Public endpoint — called before the user is authenticated (signup flow).
// Uses the admin client to bypass RLS and check username uniqueness.
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('username') ?? ''
  const username = raw.toLowerCase().trim()

  if (!username) {
    return NextResponse.json({ available: false, error: 'Username is required.' })
  }

  // Format: 3–20 chars, lowercase letters / digits / underscores / dots, no consecutive dots
  const formatOk = /^[a-z0-9][a-z0-9_.]{1,18}[a-z0-9]$/.test(username) && !username.includes('..')
  if (!formatOk) {
    return NextResponse.json({
      available: false,
      error: 'Username must be 3–20 characters and contain only letters, numbers, underscores, or dots.',
    })
  }

  const db = createAdminClient()
  const { data } = await db
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
