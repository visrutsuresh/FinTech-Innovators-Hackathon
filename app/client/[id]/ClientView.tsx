'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { Role, AssetClass } from '@/types'
import type { Client, WellnessScore, Portfolio, Asset } from '@/types'
import { calculateWellnessScore } from '@/lib/wellness'
import { getArchetype } from '@/lib/archetypes'
import { supabase } from '@/lib/supabase'
import WealthWallet from '@/components/WealthWallet'
import WellnessScorecard from '@/components/wellness/WellnessScorecard'
import ScoreBreakdown from '@/components/wellness/ScoreBreakdown'
import { useFeaturePanel } from '@/components/layout/FeaturePanelContext'
import { GlowingEffect } from '@/components/ui/glowing-effect'

interface ClientViewProps {
  client: Client
  wellnessScore: WellnessScore
}

// Assets where quantity × live price = value
const PRICE_TRACKED = [AssetClass.STOCKS, AssetClass.CRYPTO]

interface EditableAsset {
  id?: string
  name: string
  assetClass: AssetClass
  value: string     // for manually-valued classes (cash, bonds, etc.)
  quantity: string  // for stocks / crypto
  ticker: string    // finageSymbol (stocks) or coinGeckoId (crypto)
}


const ASSET_CLASS_OPTIONS: { value: AssetClass; label: string }[] = [
  { value: AssetClass.CASH, label: 'Cash' },
  { value: AssetClass.STOCKS, label: 'Stocks' },
  { value: AssetClass.CRYPTO, label: 'Crypto' },
  { value: AssetClass.BONDS, label: 'Bonds' },
  { value: AssetClass.REAL_ESTATE, label: 'Real Estate' },
  { value: AssetClass.PRIVATE, label: 'Private Equity' },
]

const REFRESH_INTERVAL_MS = 15 * 60 * 1000

function newEditRow(): EditableAsset {
  return { name: '', assetClass: AssetClass.CASH, value: '', quantity: '', ticker: '' }
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-base font-bold uppercase mb-4 underline underline-offset-4"
      style={{ color: 'var(--text-caption)', letterSpacing: '0.18em' }}
    >
      {children}
    </p>
  )
}

export default function ClientView({ client, wellnessScore }: ClientViewProps) {
  const { user, isLoading, isLoggingOut } = useAuth()
  const router = useRouter()

  const { privacyMode, registerClient, clearClient } = useFeaturePanel()

  const [livePortfolio, setLivePortfolio] = useState<Portfolio>(client.portfolio)
  const livePortfolioRef = useRef<Portfolio>(client.portfolio)
  const [liveScore, setLiveScore] = useState<WellnessScore>(wellnessScore)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)

  // Keep ref in sync so refreshPrices always reads the latest portfolio without stale closure
  useEffect(() => { livePortfolioRef.current = livePortfolio }, [livePortfolio])

  // Portfolio management modal
  const [manageOpen, setManageOpen] = useState(false)
  const [editAssets, setEditAssets] = useState<EditableAsset[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Keep feature panel context in sync with live portfolio data
  useEffect(() => {
    registerClient({
      portfolio: livePortfolio,
      wellnessScore: liveScore,
      riskProfile: client.riskProfile,
      clientId: client.id,
    })
  }, [livePortfolio, liveScore, client.riskProfile, client.id, registerClient])

  // Clear feature panel data when leaving this page
  useEffect(() => () => clearClient(), [clearClient])

  // Auth guard
  useEffect(() => {
    if (isLoading || isLoggingOut) return
    if (!user) { router.replace('/auth/login'); return }
    if (user.role === Role.CLIENT && user.id !== client.id) {
      router.replace(`/client/${user.id}`)
    }
  }, [user, isLoading, isLoggingOut, client.id, router])

  const refreshPrices = useCallback(async () => {
    try {
      // Always read from the ref so we use the latest portfolio (not the frozen client snapshot)
      const currentAssets = livePortfolioRef.current.assets

      const stockSymbols = currentAssets
        .filter(a => a.assetClass === AssetClass.STOCKS && a.finageSymbol)
        .map(a => a.finageSymbol as string)

      const coinIds = currentAssets
        .filter(a => a.isCrypto && a.coinGeckoId)
        .map(a => a.coinGeckoId as string)

      const [cryptoPrices, stockPrices] = await Promise.all([
        coinIds.length > 0
          ? fetch(`/api/crypto?ids=${coinIds.join(',')}`).then(r => r.ok ? r.json() : {}).catch(() => ({}))
          : Promise.resolve({}),
        stockSymbols.length > 0
          ? fetch(`/api/stocks?symbols=${stockSymbols.join(',')}`).then(r => r.ok ? r.json() : {}).catch(() => ({}))
          : Promise.resolve({}),
      ])

      const updatedAssets = currentAssets.map(asset => {
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

      // totalValue is always the live sum — never trust the DB-stored value
      const totalValue = updatedAssets.reduce((s, a) => s + a.value, 0)
      const updated: Portfolio = {
        ...livePortfolioRef.current,
        assets: updatedAssets,
        totalValue,
        lastUpdated: new Date().toISOString(),
      }

      setLivePortfolio(updated)
      setLiveScore(calculateWellnessScore(updated, client.riskProfile))
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Price refresh failed:', err)
    }
  }, [client.riskProfile])

  useEffect(() => {
    if (manageOpen) return // Pause refresh while user is editing to avoid stale state on save
    refreshPrices() // Fetch live prices on mount (server skips to speed initial load)
    const interval = setInterval(refreshPrices, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [refreshPrices, manageOpen])

  const handleManualRefresh = async () => {
    setRefreshing(true)
    await refreshPrices()
    setRefreshing(false)
  }

  // Open manage modal pre-populated with current assets
  const openManage = () => {
    setEditAssets(
      livePortfolio.assets.length > 0
        ? livePortfolio.assets.map(a => ({
            id: a.id,
            name: a.name,
            assetClass: a.assetClass,
            // For price-tracked assets, restore quantity + ticker; otherwise restore value
            value: PRICE_TRACKED.includes(a.assetClass) ? '' : String(a.value),
            quantity: a.quantity != null ? String(a.quantity) : '',
            ticker: a.finageSymbol ?? (a.isCrypto ? a.coinGeckoId ?? '' : '') ?? a.ticker ?? '',
          }))
        : [newEditRow()]
    )
    setSaveError('')
    setManageOpen(true)
  }

  const updateEditRow = (idx: number, field: keyof EditableAsset, val: string) => {
    setEditAssets(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  }

  const removeEditRow = (idx: number) => {
    setEditAssets(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)
  }

  const handleSavePortfolio = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const { data: portfolioData, error: pErr } = await supabase
        .from('portfolios')
        .select('id')
        .eq('client_id', client.id)
        .single()

      if (pErr || !portfolioData) throw new Error('Portfolio not found')

      const valid = editAssets.filter(a => {
        if (!a.name.trim()) return false
        if (PRICE_TRACKED.includes(a.assetClass)) {
          const qty = parseFloat(a.quantity)
          return !isNaN(qty) && qty > 0
        }
        const val = parseFloat(a.value)
        return !isNaN(val) && val >= 0
      })

      if (valid.length === 0) {
        setSaveError('Add at least one asset with a valid name and value before saving.')
        setSaving(false)
        return
      }

      // Fetch live prices BEFORE touching the DB — if this fails, existing data is safe
      const stockRows = valid.filter(a => a.assetClass === AssetClass.STOCKS && a.ticker)
      const cryptoRows = valid.filter(a => a.assetClass === AssetClass.CRYPTO && a.ticker)

      const [cryptoPrices, stockPrices] = await Promise.all([
        cryptoRows.length > 0 ? fetch('/api/crypto').then(r => r.ok ? r.json() : {}).catch(() => ({})) : Promise.resolve({}),
        stockRows.length > 0 ? fetch(`/api/stocks?symbols=${stockRows.map(a => a.ticker.toUpperCase()).join(',')}`).then(r => r.ok ? r.json() : {}).catch(() => ({})) : Promise.resolve({}),
      ])

      const inserts = valid.map(a => {
        let value = 0
        if (a.assetClass === AssetClass.STOCKS) {
          const price = (stockPrices as Record<string, number>)[a.ticker.toUpperCase()]
          if (!price && a.ticker) setSaveError(`Could not fetch price for "${a.ticker.toUpperCase()}" — it will be saved as $0. Check the ticker and try again.`)
          value = price ? price * parseFloat(a.quantity) : 0
        } else if (a.assetClass === AssetClass.CRYPTO) {
          const price = (cryptoPrices as Record<string, { usd: number }>)[a.ticker.toLowerCase()]?.usd
          if (!price && a.ticker) setSaveError(`Could not fetch price for "${a.ticker}" — it will be saved as $0. Check the coin ID and try again.`)
          value = price ? price * parseFloat(a.quantity) : 0
        } else {
          value = parseFloat(a.value || '0')
        }
        return {
          portfolio_id: portfolioData.id,
          name: a.name.trim(),
          asset_class: a.assetClass,
          value,
          currency: 'USD',
          quantity: PRICE_TRACKED.includes(a.assetClass) ? parseFloat(a.quantity) : null,
          is_crypto: a.assetClass === AssetClass.CRYPTO,
          finage_symbol: a.assetClass === AssetClass.STOCKS && a.ticker ? a.ticker.toUpperCase() : null,
          coin_gecko_id: a.assetClass === AssetClass.CRYPTO && a.ticker ? a.ticker.toLowerCase() : null,
        }
      })

      // Delete existing assets only after inserts are fully prepared — atomic swap
      await supabase.from('assets').delete().eq('portfolio_id', portfolioData.id)
      if (inserts.length > 0) await supabase.from('assets').insert(inserts)

      const totalValue = inserts.reduce((s, a) => s + a.value, 0)
      await supabase.from('portfolios').update({ total_value: totalValue, last_updated: new Date().toISOString() }).eq('id', portfolioData.id)

      // Update local state with calculated values
      const updatedAssets: Asset[] = inserts.map((a, i) => ({
        id: valid[i].id ?? `local-${i}`,
        name: a.name,
        assetClass: a.asset_class as AssetClass,
        value: a.value,
        currency: 'USD',
        quantity: a.quantity ?? undefined,
        isCrypto: a.is_crypto,
        finageSymbol: a.finage_symbol ?? undefined,
        coinGeckoId: a.coin_gecko_id ?? undefined,
      }))

      const updatedPortfolio: Portfolio = { ...livePortfolio, assets: updatedAssets, totalValue, lastUpdated: new Date().toISOString() }
      setLivePortfolio(updatedPortfolio)
      setLiveScore(calculateWellnessScore(updatedPortfolio, client.riskProfile))
      setManageOpen(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#080808' }}>
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: '#C9A227', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  const editManualTotal = editAssets
    .filter(a => !PRICE_TRACKED.includes(a.assetClass))
    .reduce((s, a) => s + (parseFloat(a.value) || 0), 0)
  const editLiveCount = editAssets.filter(a => PRICE_TRACKED.includes(a.assetClass) && parseFloat(a.quantity) > 0).length

  return (
    <div className="min-h-screen px-5 md:px-8 pt-20 pb-16" style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-start justify-between pt-4 mb-7 flex-wrap gap-3"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: 'rgba(201,162,39,0.12)',
                color: '#C9A227',
                border: '2px solid rgba(201,162,39,0.2)',
                boxShadow: '0 0 16px rgba(201,162,39,0.1)',
              }}
            >
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                {client.name}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-caption)' }}>{client.email}</p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: 'rgba(201,162,39,0.09)',
                color: '#C9A227',
                border: '1px solid rgba(201,162,39,0.2)',
              }}
            >
              {getArchetype(client.riskProfile)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Manage portfolio — only visible to the client themselves */}
            {user.role === Role.CLIENT && (
              <div className="relative rounded-lg">
                <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                <button
                  onClick={openManage}
                  className="relative flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(223,208,184,0.3)'
                    e.currentTarget.style.color = '#DFD0B8'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                  }}
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Manage
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-caption)' }}>
                {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={handleManualRefresh} disabled={refreshing}
                title="Fetch latest prices now"
                className="relative transition-colors disabled:opacity-40 rounded-md p-0.5"
                style={{ color: 'var(--text-caption)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#DFD0B8')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-caption)')}
              >
                <GlowingEffect spread={15} glow={false} disabled={false} proximity={30} inactiveZone={0.01} borderWidth={1} />
                <svg
                  width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  className={refreshing ? 'animate-spin' : ''}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {user.role === Role.ADVISER && (
              <div className="relative rounded-lg">
                <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                <button
                  onClick={() => router.push('/adviser')}
                  className="relative flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.45)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Dashboard
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Row 1 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-3">
            <Card className="p-6 h-full">
              <SectionTitle>Wealth Wallet</SectionTitle>
              <WealthWallet portfolio={livePortfolio} privacyMode={privacyMode} />
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
            <Card className="p-6 h-full">
              <SectionTitle>Wellness Score</SectionTitle>
              <WellnessScorecard score={liveScore} />
            </Card>
          </motion.div>
        </div>

        {/* ── Row 2 ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="p-6">
            <SectionTitle>Score Breakdown</SectionTitle>
            <ScoreBreakdown score={liveScore} />
          </Card>
        </motion.div>

      </div>

      {/* ── Manage Portfolio Modal ── */}
      <AnimatePresence>
        {manageOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManageOpen(false)}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md rounded-2xl flex flex-col"
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.1)',
                maxHeight: '80vh',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
              }}
            >
              {/* Modal header */}
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div>
                  <p className="text-sm font-semibold text-white">Manage Portfolio</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Add, edit or remove your assets</p>
                </div>
                <button
                  onClick={() => setManageOpen(false)}
                  className="relative w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
                  }}
                >
                  <GlowingEffect spread={15} glow={false} disabled={false} proximity={30} inactiveZone={0.01} borderWidth={1} />
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Asset rows — scrollable */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
                {editAssets.map((asset, idx) => {
                  const tracked = PRICE_TRACKED.includes(asset.assetClass)
                  return (
                    <div key={idx} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {/* Class + delete */}
                      <div className="flex items-center gap-2">
                        <select value={asset.assetClass} onChange={e => updateEditRow(idx, 'assetClass', e.target.value)}
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg outline-none text-white appearance-none cursor-pointer"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {ASSET_CLASS_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1a1a' }}>{o.label}</option>)}
                        </select>
                        <button onClick={() => removeEditRow(idx)} disabled={editAssets.length === 1}
                          className="text-white/20 hover:text-red-400 transition-colors disabled:opacity-20 flex-shrink-0">
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Name */}
                      <input type="text" value={asset.name ?? ''} onChange={e => updateEditRow(idx, 'name', e.target.value)}
                        placeholder="Asset name"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg outline-none text-white placeholder-white/20"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />

                      {/* Quantity + ticker for stocks/crypto; $ value for others */}
                      {tracked ? (
                        <div className="flex gap-2">
                          <input type="text" value={asset.ticker ?? ''} onChange={e => updateEditRow(idx, 'ticker', e.target.value)}
                            placeholder={asset.assetClass === AssetClass.STOCKS ? 'Ticker, e.g. AAPL' : 'Coin ID, e.g. bitcoin'}
                            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg outline-none text-white placeholder-white/20"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
                          <input type="number" value={asset.quantity ?? ''} onChange={e => updateEditRow(idx, 'quantity', e.target.value)}
                            placeholder="Qty" min="0" step="any"
                            className="w-20 px-2.5 py-1.5 text-xs rounded-lg outline-none text-white placeholder-white/20"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
                        </div>
                      ) : (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span>
                          <input type="number" value={asset.value ?? ''} onChange={e => updateEditRow(idx, 'value', e.target.value)}
                            placeholder="0" min="0"
                            className="w-full pl-6 pr-2.5 py-1.5 text-xs rounded-lg outline-none text-white placeholder-white/20"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
                        </div>
                      )}
                    </div>
                  )
                })}

                <button
                  onClick={() => setEditAssets(prev => [...prev, newEditRow()])}
                  className="w-full py-2 rounded-xl text-xs text-white/30 hover:text-white/60 transition-colors"
                  style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
                >
                  + Add asset
                </button>
              </div>

              {/* Modal footer */}
              <div
                className="px-5 py-4 flex-shrink-0 space-y-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Total */}
                <div className="space-y-1">
                  {editManualTotal > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/35">Manual assets</span>
                      <span className="text-xs font-semibold" style={{ color: '#C9A227' }}>
                        ${editManualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {editLiveCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/35">Live-priced assets</span>
                      <span className="text-xs text-white/40">{editLiveCount} × live price</span>
                    </div>
                  )}
                </div>

                {saveError && <p className="text-xs text-red-400">{saveError}</p>}

                <div className="relative rounded-xl">
                  <GlowingEffect spread={30} glow={false} disabled={false} proximity={60} inactiveZone={0.01} borderWidth={2} />
                  <button
                    onClick={handleSavePortfolio}
                    disabled={saving}
                    className="relative w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#DFD0B8', color: '#080808' }}
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
