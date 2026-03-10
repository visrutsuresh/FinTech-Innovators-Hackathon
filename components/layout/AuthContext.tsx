'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Role, RiskProfile, AssetClass } from '@/types'
import type { User, Client, Adviser, Asset } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  /** True only during an explicit logout flow so guards can avoid redirect flicker */
  isLoggingOut: boolean
  /** Sign in and optionally set user from signup (avoids refetch race right after signup) */
  login: (email: string, password: string, userAfterSignup?: User) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isLoggingOut: false,
  login: async (_email: string, _password: string, _userAfterSignup?: User) => { throw new Error('AuthProvider not mounted') },
  logout: async () => {},
})

// Fetch the full app user (Client or Adviser) from Supabase using the browser client.
// Subject to RLS — user must be authenticated.
async function fetchUserProfile(supabaseId: string): Promise<User | null> {
  // Fire all queries in parallel — only use the results relevant to the user's role
  const [profileResult, portfolioResult, adviserClientsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', supabaseId).single(),
    supabase.from('portfolios').select('*, assets(*)').eq('client_id', supabaseId).single(),
    supabase.from('profiles').select('id').eq('adviser_id', supabaseId),
  ])

  const { data: profile, error } = profileResult
  if (error || !profile) return null

  if (profile.role === 'adviser') {
    return {
      id: supabaseId,
      name: profile.name,
      email: profile.email,
      password: '',
      role: Role.ADVISER,
      clientIds: adviserClientsResult.data?.map((c: { id: string }) => c.id) ?? [],
      username: profile.username ?? undefined,
    } as Adviser
  }

  // Client — use the portfolio result fetched in parallel above
  const { data: portfolioRow } = portfolioResult

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAssets: any[] = (portfolioRow as { assets?: any[] } | null)?.assets ?? []
  const portfolio = portfolioRow ? { id: portfolioRow.id, total_value: portfolioRow.total_value, last_updated: portfolioRow.last_updated } : null
  const assets = rawAssets.slice().sort((a, b) => (Number(b?.value) ?? 0) - (Number(a?.value) ?? 0))

  const mappedAssets: Asset[] = (assets ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    ticker: a.ticker ?? undefined,
    assetClass: a.asset_class as AssetClass,
    value: Number(a.value),
    currency: a.currency ?? 'USD',
    quantity: a.quantity != null ? Number(a.quantity) : undefined,
    purchasePrice: a.purchase_price != null ? Number(a.purchase_price) : undefined,
    isCrypto: Boolean(a.is_crypto),
    coinGeckoId: a.coin_gecko_id ?? undefined,
    finageSymbol: a.finage_symbol ?? undefined,
  }))

  return {
    id: supabaseId,
    name: profile.name,
    email: profile.email,
    password: '',
    role: Role.CLIENT,
    riskProfile: profile.risk_profile as RiskProfile,
    investorProfile: profile.investor_profile ?? undefined,
    adviserId: profile.adviser_id ?? undefined,
    username: profile.username ?? undefined,
    portfolio: {
      assets: mappedAssets,
      totalValue: portfolio?.total_value != null
        ? Number(portfolio.total_value)
        : mappedAssets.reduce((s, a) => s + a.value, 0),
      lastUpdated: portfolio?.last_updated ?? new Date().toISOString(),
    },
  } as Client
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const loadUser = useCallback(async (supabaseId: string) => {
    const appUser = await fetchUserProfile(supabaseId)
    setUser(appUser)
  }, [])

  useEffect(() => {
    // Pre-warm the Supabase DB connection so it's awake by the time the user clicks login.
    // Supabase free-tier Postgres pauses after inactivity — this cheap query wakes it in the background.
    supabase.from('profiles').select('id').limit(1).then(() => {})

    // Restore existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadUser(session.user.id)
      }
      setIsLoading(false)
    })

    // Keep in sync with Supabase auth state changes
    // Skip SIGNED_IN — login() already calls fetchUserProfile explicitly to avoid a double fetch
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') return
      if (session?.user) {
        await loadUser(session.user.id)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [loadUser])

  const login = async (email: string, password: string, userAfterSignup?: User): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    const appUser = userAfterSignup ?? (await fetchUserProfile(data.user.id))
    if (!appUser) throw new Error('Account found but profile is missing. Please contact support.')
    setUser(appUser)
    return appUser
  }

  const logout = async () => {
    setIsLoggingOut(true)
    try {
      setUser(null) // Clear UI immediately so profile/avatar disappear right away
      await supabase.auth.signOut()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isLoggingOut, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export { Role }
