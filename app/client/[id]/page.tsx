'use client'

// Fast-path client component:
// • If the logged-in user IS this client  → render immediately from AuthContext (0 extra Supabase calls)
// • If an adviser opens this page         → one client-side fetch for the target client
// • Hard refresh / direct URL             → AuthContext restores session, then fast path kicks in
//
// This eliminates the 2 sequential Supabase round-trips that the previous server component
// was making on every login/navigation (profile query + portfolio+assets join).

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/layout/AuthContext'
import { Role, RiskProfile, AssetClass } from '@/types'
import type { Client, WellnessScore, Asset } from '@/types'
import { calculateWellnessScore } from '@/lib/wellness'
import { supabase } from '@/lib/supabase'
import ClientView from './ClientView'

interface PageProps {
  params: Promise<{ id: string }>
}

// Client-side fetch used only when an adviser navigates to a client page.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchClientById(id: string): Promise<Client | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'client')
    .single()

  if (!profile) return null

  const { data: portfolioRow } = await supabase
    .from('portfolios')
    .select('*, assets(*)')
    .eq('client_id', id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAssets: any[] = (portfolioRow as { assets?: any[] } | null)?.assets ?? []
  const assets = rawAssets.slice().sort((a, b) => Number(b?.value ?? 0) - Number(a?.value ?? 0))

  const mappedAssets: Asset[] = assets.map(a => ({
    id: a.id,
    name: a.name,
    ticker: a.ticker ?? undefined,
    assetClass: a.asset_class as AssetClass,
    value: Number(a.value),
    currency: a.currency ?? 'USD',
    quantity: a.quantity != null ? Number(a.quantity) : undefined,
    isCrypto: Boolean(a.is_crypto),
    coinGeckoId: a.coin_gecko_id ?? undefined,
    finageSymbol: a.finage_symbol ?? undefined,
  }))

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    password: '',
    role: Role.CLIENT,
    riskProfile: profile.risk_profile as RiskProfile,
    investorProfile: profile.investor_profile ?? undefined,
    adviserId: profile.adviser_id ?? undefined,
    hideAmountsFromAdviser: profile.hide_amounts_from_adviser === true,
    portfolio: {
      assets: mappedAssets,
      totalValue: portfolioRow?.total_value != null
        ? Number(portfolioRow.total_value)
        : mappedAssets.reduce((s, a) => s + a.value, 0),
      lastUpdated: portfolioRow?.last_updated ?? new Date().toISOString(),
    },
  } as Client
}

export default function ClientPage({ params }: PageProps) {
  const { id } = use(params)
  const { user, isLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [wellnessScore, setWellnessScore] = useState<WellnessScore | null>(null)

  useEffect(() => {
    if (isLoading || isLoggingOut) return

    // Not authenticated → redirect
    if (!user) {
      router.replace('/auth/login')
      return
    }

    // Fast path: the logged-in user is this client — data already in AuthContext, no fetch needed
    if (user.role === Role.CLIENT) {
      if (user.id !== id) {
        router.replace(`/client/${user.id}`)
        return
      }
      const c = user as Client
      setClient(c)
      setWellnessScore(calculateWellnessScore(c.portfolio, c.riskProfile))
      return
    }

    // Adviser path: fetch the target client's data client-side
    fetchClientById(id).then(c => {
      if (!c) { router.replace('/adviser'); return }
      setClient(c)
      setWellnessScore(calculateWellnessScore(c.portfolio, c.riskProfile))
    })
  }, [id, user, isLoading, isLoggingOut, router])

  if (!client || !wellnessScore) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#080808' }}>
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: '#C9A227', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return <ClientView client={client} wellnessScore={wellnessScore} />
}
