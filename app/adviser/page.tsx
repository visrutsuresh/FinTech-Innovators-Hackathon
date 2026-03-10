'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { supabase } from '@/lib/supabase'
import ClientTable from '@/components/adviser/ClientTable'
import SummaryStats from '@/components/adviser/SummaryStats'
import { Role, RiskProfile, AssetClass } from '@/types'
import type { Client, Asset } from '@/types'

export default function AdviserPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== Role.ADVISER)) {
      router.replace('/auth/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (!user || user.role !== Role.ADVISER) return
    const adviserId = user.id

    async function loadClients() {
      setClientsLoading(true)
      try {
        // Single query: fetch only this adviser's clients with their portfolio + assets embedded
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id, name, email, role, risk_profile, investor_profile, adviser_id,
            portfolios (
              id, total_value, last_updated,
              assets (
                id, name, ticker, asset_class, value, currency,
                quantity, is_crypto, coin_gecko_id, finage_symbol
              )
            )
          `)
          .eq('adviser_id', adviserId)
          .eq('role', 'client')

        if (profilesError) {
          console.error('Failed to load clients:', profilesError.message)
          setClients([])
          return
        }

        if (!profiles?.length) { setClients([]); setClientsLoading(false); return }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loaded: Client[] = profiles.map((profile: any) => {
          const portfolio = Array.isArray(profile.portfolios)
            ? profile.portfolios[0]
            : profile.portfolios

          const rawAssets = portfolio?.assets ?? []
          const mappedAssets: Asset[] = rawAssets
            .slice()
            .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
            .map((a: { id: string; name: string; ticker?: string; asset_class: string; value: number; currency?: string; quantity?: number; is_crypto?: boolean; coin_gecko_id?: string; finage_symbol?: string }) => ({
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
            portfolio: {
              assets: mappedAssets,
              totalValue: portfolio?.total_value != null
                ? Number(portfolio.total_value)
                : mappedAssets.reduce((s: number, a: Asset) => s + a.value, 0),
              lastUpdated: portfolio?.last_updated ?? new Date().toISOString(),
            },
          } as Client
        })

        setClients(loaded)
      } finally {
        setClientsLoading(false)
      }
    }

    loadClients()
  }, [user])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#080808' }}>
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#C9A227', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 md:px-8 pt-20 pb-16" style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 pt-4"
        >
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Adviser Dashboard</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Good day, <span style={{ color: '#C9A227' }}>{user.name}</span>
            </h1>
          </div>
        </motion.div>

        {clientsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: '#C9A227', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <SummaryStats clients={clients} />
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div>
                  <h2 className="text-sm font-semibold text-white">Client Roster</h2>
                  <p className="text-xs text-white/35 mt-0.5">
                    {clients.length} clients · click a row to open the full report
                  </p>
                </div>
              </div>
              <ClientTable clients={clients} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
