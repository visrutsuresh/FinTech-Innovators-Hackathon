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
  const { user, isLoading, isLoggingOut } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [clientsError, setClientsError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (isLoading || isLoggingOut) return
    if (!user || user.role !== Role.ADVISER) {
      router.replace('/auth/login')
    }
  }, [user, isLoading, isLoggingOut, router])

  useEffect(() => {
    if (!user || user.role !== Role.ADVISER) return
    const adviserId = user.id

    async function loadClients() {
      setClientsLoading(true)
      try {
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
          setClientsError('Failed to load clients. Check your connection and try again.')
          setClients([])
          setClientsLoading(false)
          return
        }
        setClientsError(null)

        if (!profiles?.length) { setClients([]); setClientsLoading(false); return }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loaded: Client[] = profiles.map((profile: any) => {
          const portfolio = Array.isArray(profile.portfolios)
            ? profile.portfolios[0]
            : profile.portfolios

          const rawAssets = portfolio?.assets ?? []
          const mappedAssets: Asset[] = rawAssets
            .slice()
            .sort((a: { value: number; name: string }, b: { value: number; name: string }) =>
              b.value - a.value || a.name.localeCompare(b.name)
            )
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
  }, [user, retryCount])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#080808' }}>
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(201,162,39,0.3)', borderTopColor: '#C9A227' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 md:px-8 pt-20 pb-16" style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between mb-8 pt-4"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: 'var(--text-caption)', letterSpacing: '0.1em' }}>
              Adviser Dashboard
            </p>
            <h1 className="text-2xl font-bold text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              Good day, <span style={{ color: '#C9A227' }}>{user.name}</span>
            </h1>
          </div>

          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: '#10B981',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {new Date().toLocaleDateString('en-SG', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </motion.div>

        {clientsError ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: '#111111', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <p className="text-sm text-red-400 mb-4">{clientsError}</p>
            <button
              onClick={() => { setClientsError(null); setRetryCount(c => c + 1) }}
              className="text-xs px-4 py-2 rounded-xl transition-colors"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
            >
              Retry
            </button>
          </div>
        ) : clientsLoading ? (
          <div className="space-y-4">
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="p-5 rounded-2xl space-y-3"
                  style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="skeleton w-9 h-9 rounded-xl" />
                  <div className="skeleton h-6 w-24 rounded" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              ))}
            </div>
            {/* Table skeleton */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="skeleton h-4 w-28 rounded" />
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-32 rounded" />
                    <div className="skeleton h-2.5 w-40 rounded" />
                  </div>
                  <div className="skeleton h-3 w-20 rounded" />
                  <div className="skeleton h-5 w-20 rounded-full" />
                  <div className="skeleton h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <SummaryStats clients={clients} />
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div>
                  <h2 className="text-sm font-semibold text-white">Client Roster</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
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
