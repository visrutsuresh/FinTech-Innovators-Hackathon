'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Role, RiskProfile, AssetClass } from '@/types'
import type { User, Client, Adviser, Asset } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  login: async () => { throw new Error('AuthProvider not mounted') },
  logout: async () => {},
})

// Fetch the full app user (Client or Adviser) from Supabase using the browser client.
// Subject to RLS — user must be authenticated.
async function fetchUserProfile(supabaseId: string): Promise<User | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseId)
    .single()

  if (error || !profile) return null

  if (profile.role === 'adviser') {
    const { data: clientProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('adviser_id', supabaseId)

    return {
      id: supabaseId,
      name: profile.name,
      email: profile.email,
      password: '',
      role: Role.ADVISER,
      clientIds: clientProfiles?.map((c: { id: string }) => c.id) ?? [],
    } as Adviser
  }

  // Client — fetch portfolio + assets
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('client_id', supabaseId)
    .single()

  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('portfolio_id', portfolio?.id ?? '')
    .order('value', { ascending: false })

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

  const loadUser = useCallback(async (supabaseId: string) => {
    const appUser = await fetchUserProfile(supabaseId)
    setUser(appUser)
  }, [])

  useEffect(() => {
    // Restore existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadUser(session.user.id)
      }
      setIsLoading(false)
    })

    // Keep in sync with Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUser(session.user.id)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [loadUser])

  const login = async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    const appUser = await fetchUserProfile(data.user.id)
    if (!appUser) throw new Error('Account found but profile is missing. Please contact support.')
    setUser(appUser)
    return appUser
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export { Role }
