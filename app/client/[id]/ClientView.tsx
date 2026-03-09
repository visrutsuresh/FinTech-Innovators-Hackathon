'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { Role, AssetClass } from '@/types'
import type { Client, WellnessScore, Portfolio } from '@/types'
import { calculateWellnessScore } from '@/lib/wellness'
import WealthWallet from '@/components/WealthWallet'
import WellnessScorecard from '@/components/wellness/WellnessScorecard'
import ScoreBreakdown from '@/components/wellness/ScoreBreakdown'
import AIRecommendations from '@/components/AIRecommendations'

interface ClientViewProps {
  client: Client
  wellnessScore: WellnessScore
}

const RISK_COLOR: Record<string, string> = {
  conservative: '#10B981',
  moderate: '#C9A227',
  aggressive: '#EF4444',
}

// Refresh every 15 minutes — controlled by FINAGE_ENABLED env var server-side
const REFRESH_INTERVAL_MS = 15 * 60 * 1000

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
      {children}
    </p>
  )
}

export default function ClientView({ client, wellnessScore }: ClientViewProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Live price state — initialised from server-rendered props
  const [livePortfolio, setLivePortfolio] = useState<Portfolio>(client.portfolio)
  const [liveScore, setLiveScore] = useState<WellnessScore>(wellnessScore)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)

  // Auth guard
  useEffect(() => {
    if (isLoading) return
    if (!user) { router.replace('/auth/login'); return }
    if (user.role === Role.CLIENT && user.id !== client.id) {
      router.replace(`/client/${user.id}`)
    }
  }, [user, isLoading, client.id, router])

  // Fetch fresh prices client-side and recompute portfolio + wellness score
  const refreshPrices = useCallback(async () => {
    try {
      const stockSymbols = client.portfolio.assets
        .filter(a => a.assetClass === AssetClass.STOCKS && a.finageSymbol)
        .map(a => a.finageSymbol as string)

      const [cryptoPrices, stockPrices] = await Promise.all([
        fetch('/api/crypto').then(r => r.ok ? r.json() : {}).catch(() => ({})),
        stockSymbols.length > 0
          ? fetch(`/api/stocks?symbols=${stockSymbols.join(',')}`).then(r => r.ok ? r.json() : {}).catch(() => ({}))
          : Promise.resolve({}),
      ])

      const updatedAssets = client.portfolio.assets.map(asset => {
        if (asset.isCrypto && asset.coinGeckoId) {
          const live = (cryptoPrices as Record<string, { usd: number }>)[asset.coinGeckoId]
          if (live?.usd) return { ...asset, value: live.usd * (asset.quantity ?? 1) }
        }
        if (asset.assetClass === AssetClass.STOCKS && asset.finageSymbol) {
          const livePrice = (stockPrices as Record<string, number>)[asset.finageSymbol]
          if (livePrice) return { ...asset, value: livePrice * (asset.quantity ?? 1) }
        }
        return asset
      })

      const updated: Portfolio = {
        ...client.portfolio,
        assets: updatedAssets,
        totalValue: updatedAssets.reduce((s, a) => s + a.value, 0),
        lastUpdated: new Date().toISOString(),
      }

      setLivePortfolio(updated)
      setLiveScore(calculateWellnessScore(updated, client.riskProfile))
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Price refresh failed:', err)
    }
  }, [client])

  // Auto-refresh every 15 minutes — server returns fallbacks when FINAGE_ENABLED=false
  useEffect(() => {
    const interval = setInterval(refreshPrices, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refreshPrices])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    await refreshPrices()
    setRefreshing(false)
  }

  const riskColor = RISK_COLOR[client.riskProfile] ?? '#C9A227'

  return (
    <div className="min-h-screen px-5 md:px-8 pt-20 pb-16" style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto">

        {/* ── Page header ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between pt-4 mb-7 flex-wrap gap-3"
        >
          {/* Left: avatar + name + badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'rgba(201,162,39,0.12)', color: '#C9A227' }}
            >
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{client.name}</h1>
              <p className="text-xs text-white/35">{client.email}</p>
            </div>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full ml-1 capitalize"
              style={{
                background: `${riskColor}12`,
                color: riskColor,
                border: `1px solid ${riskColor}25`,
              }}
            >
              {client.riskProfile} risk
            </span>
            {client.investorProfile && (
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(201,162,39,0.08)',
                  color: '#C9A227',
                  border: '1px solid rgba(201,162,39,0.2)',
                }}
              >
                {client.investorProfile}
              </span>
            )}
          </div>

          {/* Right: last updated + refresh + back */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/25">
                Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                title="Fetch latest prices now"
                className="text-white/30 hover:text-white/70 transition-colors disabled:opacity-40"
              >
                <svg
                  width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  className={refreshing ? 'animate-spin' : ''}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {user.role === Role.ADVISER && (
              <button
                onClick={() => router.push('/adviser')}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to dashboard
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Row 1: Portfolio + Wellness score ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-3"
          >
            <Card className="p-6 h-full">
              <SectionTitle>Wealth Wallet</SectionTitle>
              <WealthWallet portfolio={livePortfolio} />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 h-full">
              <SectionTitle>Wellness Score</SectionTitle>
              <WellnessScorecard score={liveScore} />
            </Card>
          </motion.div>
        </div>

        {/* ── Row 2: Score breakdown + AI chatbot ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="p-6 h-full">
              <SectionTitle>Score Breakdown</SectionTitle>
              <ScoreBreakdown score={liveScore} />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 h-full">
              <AIRecommendations
                clientId={client.id}
                portfolio={livePortfolio}
                wellnessScore={liveScore}
                riskProfile={client.riskProfile}
              />
            </Card>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
