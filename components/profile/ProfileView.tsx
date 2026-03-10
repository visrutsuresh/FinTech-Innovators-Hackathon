'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { Role, AssetClass } from '@/types'
import type { Portfolio, Asset } from '@/types'
import { supabase } from '@/lib/supabase'
import WealthWallet from '@/components/WealthWallet'
import { getArchetype } from '@/lib/archetypes'
import DirectMessages from '@/components/DirectMessages'
import { GlowingEffect } from '@/components/ui/glowing-effect'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProfileRow {
  id: string
  name: string
  email: string
  username?: string
  role?: string
  risk_profile?: string
}

interface AdviserRequest {
  id: string
  adviser_id: string
  client_id: string
  status: 'pending' | 'accepted' | 'rejected'
  profile?: ProfileRow
}

interface NokNomination {
  id: string
  nominator_id: string
  nominee_id: string
  status: 'pending' | 'accepted' | 'rejected'
  profile?: ProfileRow
}

// ── Small shared UI ────────────────────────────────────────────────────────────

const GOLD = '#C9A227'
const EMERALD = '#10B981'

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-semibold uppercase mb-2.5"
      style={{ fontSize: 11, letterSpacing: '0.22em', color: 'var(--text-caption)' }}
    >
      {children}
    </p>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending: { bg: `${GOLD}14`, color: GOLD },
    accepted: { bg: 'rgba(16,185,129,0.12)', color: EMERALD },
    rejected: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
  }
  const s = map[status] ?? map.pending
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded-md capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  )
}

function Avatar({
  name, size = 8, color = GOLD,
}: { name: string; size?: number; color?: string }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: `${color}18`, color, fontSize: size <= 7 ? 11 : 13 }}
    >
      {name.charAt(0)}
    </div>
  )
}

function Spinner() {
  return (
    <div
      className="w-3.5 h-3.5 rounded-full border-2 animate-spin"
      style={{ borderColor: GOLD, borderTopColor: 'transparent' }}
    />
  )
}

function SearchBox({
  value, onChange, placeholder, loading,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  loading: boolean
}) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none placeholder-white/20 transition-all"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}40`)}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Spinner />
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ProfileView() {
  const { user, isLoading, isLoggingOut } = useAuth()
  const router = useRouter()

  // ── State ────────────────────────────────────────────────────────────────────
  const [dataLoading, setDataLoading] = useState(true)

  // Adviser state
  const [connectedClients, setConnectedClients] = useState<ProfileRow[]>([])
  const [sentAdviserReqs, setSentAdviserReqs] = useState<AdviserRequest[]>([])

  // Client state
  const [myAdviser, setMyAdviser] = useState<ProfileRow | null>(null)
  const [incomingAdviserReqs, setIncomingAdviserReqs] = useState<AdviserRequest[]>([])
  const [myNok, setMyNok] = useState<NokNomination | null>(null)

  // Shared (anyone can be nominated as NOK)
  const [nokForMe, setNokForMe] = useState<NokNomination[]>([])

  // Adviser search
  const [adviserSearch, setAdviserSearch] = useState('')
  const [adviserResults, setAdviserResults] = useState<ProfileRow[]>([])
  const [adviserSearching, setAdviserSearching] = useState(false)

  // NOK search
  const [nokSearch, setNokSearch] = useState('')
  const [nokResults, setNokResults] = useState<ProfileRow[]>([])
  const [nokSearching, setNokSearching] = useState(false)

  // NOK portfolio modal
  const [nokPortfolio, setNokPortfolio] = useState<{ name: string; portfolio: Portfolio } | null>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [messageTarget, setMessageTarget] = useState<{ id: string; name: string } | null>(null)

  const adviserTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nokTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auth guard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || isLoggingOut) return
    if (!user) router.replace('/auth/login')
  }, [user, isLoading, isLoggingOut, router])

  // ── Load data ─────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!user) return
    setDataLoading(true)

    if (user.role === Role.ADVISER) {
      // Connected clients
      const { data: clients } = await supabase
        .from('profiles')
        .select('id, name, email, username, risk_profile')
        .eq('adviser_id', user.id)
      setConnectedClients(clients ?? [])

      // Pending sent requests
      const { data: sent } = await supabase
        .from('adviser_client_requests')
        .select('id, adviser_id, client_id, status')
        .eq('adviser_id', user.id)
        .eq('status', 'pending')

      if (sent && sent.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email, username')
          .in('id', sent.map(r => r.client_id))
        const map = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
        setSentAdviserReqs(sent.map(r => ({ ...r, profile: map[r.client_id] })))
      } else {
        setSentAdviserReqs([])
      }
    } else {
      // My adviser
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('adviser_id')
        .eq('id', user.id)
        .single()

      if (myProfile?.adviser_id) {
        const { data: advProfile } = await supabase
          .from('profiles')
          .select('id, name, email, username')
          .eq('id', myProfile.adviser_id)
          .single()
        setMyAdviser(advProfile ?? null)
      } else {
        setMyAdviser(null)
      }

      // Incoming adviser requests
      const { data: incoming } = await supabase
        .from('adviser_client_requests')
        .select('id, adviser_id, client_id, status')
        .eq('client_id', user.id)
        .eq('status', 'pending')

      if (incoming && incoming.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email, username')
          .in('id', incoming.map(r => r.adviser_id))
        const map = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
        setIncomingAdviserReqs(incoming.map(r => ({ ...r, profile: map[r.adviser_id] })))
      } else {
        setIncomingAdviserReqs([])
      }

      // My NOK nomination (latest active one)
      const { data: nokRows } = await supabase
        .from('nok_nominations')
        .select('id, nominator_id, nominee_id, status')
        .eq('nominator_id', user.id)
        .neq('status', 'rejected')
        .order('created_at', { ascending: false })
        .limit(1)

      const nokRow = nokRows?.[0] ?? null
      if (nokRow) {
        const { data: nomineeProfile } = await supabase
          .from('profiles')
          .select('id, name, email, username')
          .eq('id', nokRow.nominee_id)
          .single()
        setMyNok({ ...nokRow, profile: nomineeProfile ?? undefined })
      } else {
        setMyNok(null)
      }
    }

    // Nominations where I'm the nominee (any role can be someone's NOK)
    const { data: forMe } = await supabase
      .from('nok_nominations')
      .select('id, nominator_id, nominee_id, status')
      .eq('nominee_id', user.id)
      .neq('status', 'rejected')

    if (forMe && forMe.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, username')
        .in('id', forMe.map(r => r.nominator_id))
      const map = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
      setNokForMe(forMe.map(r => ({ ...r, profile: map[r.nominator_id] })))
    } else {
      setNokForMe([])
    }

    setDataLoading(false)
  }, [user])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  // ── Search: adviser looking for clients ────────────────────────────────────────
  const handleAdviserSearch = (q: string) => {
    setAdviserSearch(q)
    if (adviserTimer.current) clearTimeout(adviserTimer.current)
    if (!q.trim()) { setAdviserResults([]); return }
    setAdviserSearching(true)
    adviserTimer.current = setTimeout(async () => {
      const pendingIds = sentAdviserReqs.map(r => r.client_id).filter(Boolean)
      const connectedIds = connectedClients.map(c => c.id).filter(Boolean)
      const excludeIds = [...new Set([...pendingIds, ...connectedIds])]

      let query = supabase
        .from('profiles')
        .select('id, name, email, username, role')
        .ilike('username', `%${q}%`)
        .eq('role', 'client')
        .neq('id', user!.id)
        .limit(6)

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`)
      }

      const { data } = await query
      setAdviserResults(data ?? [])
      setAdviserSearching(false)
    }, 300)
  }

  // ── Search: client looking for NOK ────────────────────────────────────────────
  const handleNokSearch = (q: string) => {
    setNokSearch(q)
    if (nokTimer.current) clearTimeout(nokTimer.current)
    if (!q.trim()) { setNokResults([]); return }
    setNokSearching(true)
    nokTimer.current = setTimeout(async () => {
      const excludeIds = [user!.id, myNok?.nominee_id].filter(Boolean) as string[]

      let query = supabase
        .from('profiles')
        .select('id, name, email, username, role')
        .ilike('username', `%${q}%`)
        .limit(6)

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`)
      }

      const { data } = await query
      setNokResults(data ?? [])
      setNokSearching(false)
    }, 300)
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  const sendAdviserRequest = async (clientId: string) => {
    setActionLoading(`send-adv-${clientId}`)
    await supabase.from('adviser_client_requests').upsert(
      { adviser_id: user!.id, client_id: clientId, status: 'pending' },
      { onConflict: 'adviser_id,client_id' },
    )
    setAdviserSearch('')
    setAdviserResults([])
    await loadData()
    setActionLoading(null)
  }

  const sendNokNomination = async (nomineeId: string) => {
    setActionLoading(`send-nok-${nomineeId}`)
    if (myNok) {
      await supabase.from('nok_nominations').update({ status: 'rejected' }).eq('id', myNok.id)
    }
    await supabase.from('nok_nominations').insert({
      nominator_id: user!.id,
      nominee_id: nomineeId,
      status: 'pending',
    })
    setNokSearch('')
    setNokResults([])
    await loadData()
    setActionLoading(null)
  }

  const acceptAdviserRequest = async (req: AdviserRequest) => {
    setActionLoading(`accept-adv-${req.id}`)
    await supabase.from('adviser_client_requests').update({ status: 'accepted' }).eq('id', req.id)
    await supabase.from('profiles').update({ adviser_id: req.adviser_id }).eq('id', user!.id)
    await loadData()
    setActionLoading(null)
  }

  const rejectAdviserRequest = async (id: string) => {
    setActionLoading(`reject-adv-${id}`)
    await supabase.from('adviser_client_requests').update({ status: 'rejected' }).eq('id', id)
    await loadData()
    setActionLoading(null)
  }

  const acceptNok = async (id: string) => {
    setActionLoading(`accept-nok-${id}`)
    await supabase.from('nok_nominations').update({ status: 'accepted' }).eq('id', id)
    await loadData()
    setActionLoading(null)
  }

  const rejectNok = async (id: string) => {
    setActionLoading(`reject-nok-${id}`)
    await supabase.from('nok_nominations').update({ status: 'rejected' }).eq('id', id)
    await loadData()
    setActionLoading(null)
  }

  const revokeMyNok = async () => {
    if (!myNok) return
    setActionLoading('revoke-nok')
    await supabase.from('nok_nominations').update({ status: 'rejected' }).eq('id', myNok.id)
    setMyNok(null)
    setActionLoading(null)
  }

  const viewNominatorPortfolio = async (nom: NokNomination) => {
    setPortfolioLoading(true)
    const { data: portfolioRow } = await supabase
      .from('portfolios')
      .select('*, assets(*)')
      .eq('client_id', nom.nominator_id)
      .single()

    if (portfolioRow) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawAssets: any[] = (portfolioRow as { assets?: any[] }).assets ?? []
      const mappedAssets: Asset[] = rawAssets.map(a => ({
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
      const portfolio: Portfolio = {
        assets: mappedAssets,
        totalValue: Number(portfolioRow.total_value) || mappedAssets.reduce((s, a) => s + a.value, 0),
        lastUpdated: portfolioRow.last_updated ?? new Date().toISOString(),
      }
      setNokPortfolio({ name: nom.profile?.name ?? 'Unknown', portfolio })
    } else {
      setNokPortfolio({ name: nom.profile?.name ?? 'Unknown', portfolio: { assets: [], totalValue: 0, lastUpdated: new Date().toISOString() } })
    }
    setPortfolioLoading(false)
  }

  // ── Loading / auth ────────────────────────────────────────────────────────────
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#080808' }}>
        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const isAdviser = user.role === Role.ADVISER
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const username = (user as any).username
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const riskProfile = (user as any).riskProfile

  const totalIncoming = incomingAdviserReqs.length + nokForMe.filter(n => n.status === 'pending').length

  return (
    <div className="min-h-screen px-5 md:px-8 pt-20 pb-16" style={{ background: '#080808' }}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* ── Profile header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: `${GOLD}18`, color: GOLD }}
              >
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{user.name}</h1>
                <p className="text-base" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                {username && (
                  <p className="text-sm font-mono mt-1" style={{ color: `${GOLD}80` }}>@{username}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    background: isAdviser ? `${GOLD}14` : 'rgba(16,185,129,0.1)',
                    color: isAdviser ? GOLD : EMERALD,
                    border: `1px solid ${isAdviser ? `${GOLD}30` : 'rgba(16,185,129,0.25)'}`,
                  }}
                >
                  {isAdviser ? 'Adviser' : 'Client'}
                </span>
                {!isAdviser && (
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: `${GOLD}12`,
                      color: GOLD,
                      border: `1px solid ${GOLD}25`,
                    }}
                  >
                    {getArchetype(riskProfile)}
                  </span>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">

            {/* ── Left column ── */}
            <div className="space-y-4">

              {isAdviser ? (
                /* ─── ADVISER: Client connections ─── */
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Card className="p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: 'var(--text-caption)' }}>
                      Client Connections
                    </p>

                    {/* Connected clients list */}
                    {connectedClients.length > 0 && (
                      <div className="mb-6 space-y-1.5">
                        <SectionLabel>Connected clients</SectionLabel>
                        {connectedClients.map((c, i) => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                            style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.14)' }}
                          >
                            <div className="flex items-center gap-2.5">
                              <Avatar name={c.name} size={8} color={EMERALD} />
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{c.name}</p>
                                {c.username
                                  ? <p className="text-xs font-mono" style={{ color: `${EMERALD}70` }}>@{c.username}</p>
                                  : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.email}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {c.risk_profile && (
                                <span className="text-xs" style={{ color: GOLD }}>
                                  {getArchetype(c.risk_profile)}
                                </span>
                              )}
                              <div className="relative rounded-lg">
                                <GlowingEffect spread={15} glow={false} disabled={false} proximity={30} inactiveZone={0.01} borderWidth={1} />
                                <button
                                  onClick={() => router.push(`/client/${c.id}`)}
                                  className="relative text-xs px-3 py-1 rounded-lg transition-colors hover:text-white"
                                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}
                                >
                                  View
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Pending sent requests */}
                    {sentAdviserReqs.length > 0 && (
                      <div className="mb-6">
                        <SectionLabel>Pending requests</SectionLabel>
                        <div className="space-y-1.5">
                          {sentAdviserReqs.map(req => (
                            <div
                              key={req.id}
                              className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                              style={{ background: `${GOLD}06`, border: `1px solid ${GOLD}18` }}
                            >
                              <div className="flex items-center gap-2.5">
                                <Avatar name={req.profile?.name ?? '?'} size={7} color={GOLD} />
                                <div>
                                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{req.profile?.name ?? req.client_id}</p>
                                  {req.profile?.username && (
                                    <p className="text-xs font-mono" style={{ color: `${GOLD}60` }}>@{req.profile.username}</p>
                                  )}
                                </div>
                              </div>
                              <StatusPill status="pending" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search for clients */}
                    <div>
                      <SectionLabel>Add client by username</SectionLabel>
                      <SearchBox
                        value={adviserSearch}
                        onChange={handleAdviserSearch}
                        placeholder="Search username…"
                        loading={adviserSearching}
                      />
                      <AnimatePresence>
                        {adviserResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="mt-1.5 rounded-xl overflow-hidden"
                            style={{ border: '1px solid rgba(255,255,255,0.09)', background: '#141414' }}
                          >
                            {adviserResults.map((r, i) => {
                              const connected = connectedClients.some(c => c.id === r.id)
                              const requested = sentAdviserReqs.some(s => s.client_id === r.id)
                              return (
                                <div
                                  key={r.id}
                                  className="flex items-center justify-between px-3.5 py-2.5"
                                  style={{ borderBottom: i < adviserResults.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                >
                                  <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{r.name}</p>
                                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>@{r.username}</p>
                                  </div>
                                  {connected ? (
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Connected</span>
                                  ) : requested ? (
                                    <span className="text-xs" style={{ color: GOLD }}>Requested</span>
                                  ) : (
                                    <div className="relative rounded-lg">
                                      <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                                      <button
                                        onClick={() => sendAdviserRequest(r.id)}
                                        disabled={actionLoading === `send-adv-${r.id}`}
                                        className="relative text-[10px] px-2.5 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50"
                                        style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}35` }}
                                      >
                                        {actionLoading === `send-adv-${r.id}` ? '…' : 'Send Request'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </motion.div>
                        )}
                        {adviserSearch.trim() && !adviserSearching && adviserResults.length === 0 && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xs mt-2 px-1"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            No clients found with that username.
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </Card>
                </motion.div>

              ) : (
                /* ─── CLIENT sections ─── */
                <>
                  {/* My Adviser */}
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card className="p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] mb-4" style={{ color: 'var(--text-caption)' }}>
                        My Adviser
                      </p>
                      {myAdviser ? (
                        <div
                          className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
                          style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}
                        >
                          <Avatar name={myAdviser.name} size={10} color={GOLD} />
                          <div>
                            <p className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>{myAdviser.name}</p>
                            {myAdviser.username && (
                              <p className="text-sm font-mono mt-0.5" style={{ color: `${GOLD}70` }}>@{myAdviser.username}</p>
                            )}
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{myAdviser.email}</p>
                          </div>
                        </div>
                        ) : (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          No adviser linked yet. Ask your adviser to search for your username and send a connection request.
                        </p>
                      )}
                    </Card>
                  </motion.div>

                  {/* Next of Kin Nomination */}
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="p-6">
                      <p className="text-sm font-semibold uppercase tracking-[0.22em] mb-5" style={{ color: 'var(--text-caption)' }}>
                        Next of Kin Nomination
                      </p>

                      {/* Current NOK */}
                      {myNok && (
                        <div className="mb-5">
                          <SectionLabel>Your nominated next of kin</SectionLabel>
                          <div
                            className="flex items-center justify-between px-3.5 py-3 rounded-xl"
                            style={{
                              background: myNok.status === 'accepted' ? 'rgba(16,185,129,0.05)' : `${GOLD}06`,
                              border: `1px solid ${myNok.status === 'accepted' ? 'rgba(16,185,129,0.18)' : `${GOLD}18`}`,
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                name={myNok.profile?.name ?? '?'}
                                size={9}
                                color={myNok.status === 'accepted' ? EMERALD : GOLD}
                              />
                              <div>
                                <p className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
                                  {myNok.profile?.name ?? myNok.nominee_id}
                                </p>
                                {myNok.profile?.username && (
                                  <p
                                    className="text-sm font-mono"
                                    style={{ color: myNok.status === 'accepted' ? `${EMERALD}70` : `${GOLD}60` }}
                                  >
                                    @{myNok.profile.username}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusPill status={myNok.status} />
                              <div className="relative rounded-lg">
                                <GlowingEffect spread={15} glow={false} disabled={false} proximity={30} inactiveZone={0.01} borderWidth={1} />
                                <button
                                  onClick={revokeMyNok}
                                  disabled={actionLoading === 'revoke-nok'}
                                  className="relative text-[10px] px-2 py-1 rounded-lg transition-colors text-white/30 hover:text-red-400 disabled:opacity-40"
                                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                                >
                                  Revoke
                                </button>
                              </div>
                            </div>
                          </div>
                          {myNok.status === 'pending' && (
                            <p className="text-xs mt-1.5 px-1" style={{ color: 'var(--text-muted)' }}>
                              Waiting for them to accept. They will be able to view your assets once accepted.
                            </p>
                          )}
                        </div>
                      )}

                      {/* NOK search */}
                      <div>
                        <SectionLabel>{myNok ? 'Change next of kin' : 'Nominate by username'}</SectionLabel>
                        <SearchBox
                          value={nokSearch}
                          onChange={handleNokSearch}
                          placeholder="Search username…"
                          loading={nokSearching}
                        />
                        <AnimatePresence>
                          {nokResults.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="mt-1.5 rounded-xl overflow-hidden"
                              style={{ border: '1px solid rgba(255,255,255,0.09)', background: '#141414' }}
                            >
                              {nokResults.map((r, i) => {
                                const isCurrent = myNok?.nominee_id === r.id
                                return (
                                  <div
                                    key={r.id}
                                    className="flex items-center justify-between px-3.5 py-2.5"
                                    style={{ borderBottom: i < nokResults.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                                  >
                                    <div>
                                      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{r.name}</p>
                                      <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                                        @{r.username}
                                        {r.role && (
                                          <span className="ml-1.5 not-italic" style={{ color: 'var(--text-caption)' }}>
                                            · {r.role}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    {isCurrent ? (
                                      <span className="text-[10px]" style={{ color: GOLD }}>Current NOK</span>
                                    ) : (
                                      <div className="relative rounded-lg">
                                        <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                                        <button
                                          onClick={() => sendNokNomination(r.id)}
                                          disabled={!!actionLoading}
                                          className="relative text-[10px] px-2.5 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50"
                                          style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}35` }}
                                        >
                                          {actionLoading === `send-nok-${r.id}` ? '…' : myNok ? 'Replace' : 'Nominate'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </motion.div>
                          )}
                          {nokSearch.trim() && !nokSearching && nokResults.length === 0 && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-[10px] text-white/25 mt-2 px-1"
                            >
                              No users found with that username.
                            </motion.p>
                          )}
                        </AnimatePresence>
                        <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          Your next of kin will be able to view your portfolio after accepting. You can change or revoke this at any time. They cannot see your identity unless they already know you.
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                </>
              )}
            </div>

            {/* ── Right column: Incoming requests ── */}
            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="p-6 flex-1">
                <div className="flex items-center gap-2 mb-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/30">Incoming Requests</p>
                  {totalIncoming > 0 && (
                    <span
                      className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: GOLD, color: '#080808' }}
                    >
                      {totalIncoming}
                    </span>
                  )}
                </div>

                {/* Incoming adviser requests (clients only) */}
                {!isAdviser && incomingAdviserReqs.length > 0 && (
                  <div className="mb-5">
                    <SectionLabel>Adviser requests</SectionLabel>
                    <div className="space-y-2">
                      {incomingAdviserReqs.map(req => (
                        <div
                          key={req.id}
                          className="rounded-xl p-4 space-y-3"
                          style={{ background: `${GOLD}06`, border: `1px solid ${GOLD}18` }}
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar name={req.profile?.name ?? '?'} size={9} color={GOLD} />
                            <div>
                              <p className="text-sm font-medium text-white/80">{req.profile?.name}</p>
                              {req.profile?.username && (
                                <p className="text-xs font-mono" style={{ color: `${GOLD}60` }}>@{req.profile.username}</p>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-white/35 leading-snug">
                            Wants to connect as your financial adviser.
                          </p>
                          <div className="flex gap-1.5">
                            <div className="relative rounded-lg flex-1">
                              <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                              <button
                                onClick={() => acceptAdviserRequest(req)}
                                disabled={!!actionLoading}
                                className="relative w-full py-1.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                style={{ background: EMERALD, color: '#080808' }}
                              >
                                {actionLoading === `accept-adv-${req.id}` ? '…' : 'Accept'}
                              </button>
                            </div>
                            <div className="relative rounded-lg flex-1">
                              <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                              <button
                                onClick={() => rejectAdviserRequest(req.id)}
                                disabled={!!actionLoading}
                                className="relative w-full py-1.5 rounded-lg text-sm transition-all disabled:opacity-50 text-white/45 hover:text-white/70"
                                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NOK nominations (anyone) */}
                {nokForMe.length > 0 && (
                  <div>
                    <SectionLabel>Next of kin nominations</SectionLabel>
                    <div className="space-y-2">
                      {nokForMe.map(nom => (
                        <div
                          key={nom.id}
                          className="rounded-xl p-3.5 space-y-3"
                          style={{
                            background: nom.status === 'accepted' ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${nom.status === 'accepted' ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.07)'}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                name={nom.profile?.name ?? '?'}
                                size={8}
                                color={nom.status === 'accepted' ? EMERALD : 'rgba(255,255,255,0.5)'}
                              />
                              <div>
                                <p className="text-sm font-medium text-white/80">{nom.profile?.name}</p>
                                {nom.profile?.username && (
                                  <p
                                    className="text-xs font-mono"
                                    style={{ color: nom.status === 'accepted' ? `${EMERALD}60` : 'var(--text-caption)' }}
                                  >
                                    @{nom.profile.username}
                                  </p>
                                )}
                              </div>
                            </div>
                            <StatusPill status={nom.status} />
                          </div>

                          <p className="text-xs text-white/35 leading-snug">
                            {nom.status === 'accepted'
                              ? 'You are their nominated next of kin. You can view their assets.'
                              : 'Has nominated you as their next of kin.'}
                          </p>

                          {nom.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <div className="relative rounded-lg flex-1">
                                <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                                <button
                                  onClick={() => acceptNok(nom.id)}
                                  disabled={!!actionLoading}
                                  className="relative w-full py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
                                  style={{ background: EMERALD, color: '#080808' }}
                                >
                                  {actionLoading === `accept-nok-${nom.id}` ? '…' : 'Accept'}
                                </button>
                              </div>
                              <div className="relative rounded-lg flex-1">
                                <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                                <button
                                  onClick={() => rejectNok(nom.id)}
                                  disabled={!!actionLoading}
                                  className="relative w-full py-1.5 rounded-lg text-[11px] transition-all disabled:opacity-50 text-white/45 hover:text-white/70"
                                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          )}

                          {nom.status === 'accepted' && (
                            <div className="relative rounded-lg">
                              <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                            <button
                              onClick={() => viewNominatorPortfolio(nom)}
                              disabled={portfolioLoading}
                              className="relative w-full py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                              style={{ background: 'rgba(16,185,129,0.1)', color: EMERALD, border: '1px solid rgba(16,185,129,0.2)' }}
                            >
                              {portfolioLoading ? (
                                <><Spinner /> Loading…</>
                              ) : (
                                <>
                                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  View {nom.profile?.name?.split(' ')[0]}&apos;s Portfolio
                                </>
                              )}
                            </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {totalIncoming === 0 && (
                  <p className="text-xs text-white/20">No pending requests right now.</p>
                )}
              </Card>
            </motion.div>

          </div>

          {/* ── Messages ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-5">Messages</p>

              {isAdviser ? (
                connectedClients.length === 0 ? (
                  <p className="text-xs text-white/20">Connect with clients to start messaging.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {connectedClients.map(c => {
                        const active = messageTarget?.id === c.id
                        return (
                          <div key={c.id} className="relative rounded-full">
                            <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                            <button
                              onClick={() => setMessageTarget(active ? null : { id: c.id, name: c.name })}
                              className="relative text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                              style={active
                                ? { background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30` }
                                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                              {c.name.split(' ')[0]}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    {messageTarget && (
                      <DirectMessages
                        myId={user.id}
                        otherId={messageTarget.id}
                        otherName={messageTarget.name}
                      />
                    )}
                    {!messageTarget && (
                      <p className="text-xs text-white/20">Select a client above to open their thread.</p>
                    )}
                  </div>
                )
              ) : (
                myAdviser ? (
                  <DirectMessages
                    myId={user.id}
                    otherId={myAdviser.id}
                    otherName={myAdviser.name}
                  />
                ) : (
                  <p className="text-xs text-white/20">Link with an adviser to start messaging.</p>
                )
              )}
            </Card>
          </motion.div>
          </>
        )}
      </div>

      {/* ── NOK Portfolio Modal ── */}
      <AnimatePresence>
        {nokPortfolio && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNokPortfolio(null)}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md rounded-2xl flex flex-col"
              style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '82vh' }}
            >
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{nokPortfolio.name}&apos;s Portfolio</p>
                  <p className="text-xs text-white/30 mt-0.5">Shared with you as next of kin · read-only</p>
                </div>
                <button
                  onClick={() => setNokPortfolio(null)}
                  className="relative text-white/25 hover:text-white/70 transition-colors rounded-md p-1"
                >
                  <GlowingEffect spread={15} glow={false} disabled={false} proximity={30} inactiveZone={0.01} borderWidth={1} />
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <WealthWallet portfolio={nokPortfolio.portfolio} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
