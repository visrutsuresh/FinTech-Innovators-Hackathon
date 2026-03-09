'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { supabase } from '@/lib/supabase'
import { Role, RiskProfile, AssetClass } from '@/types'

const GOLD = '#C9A227'

const QUESTIONS = [
  {
    q: 'You hear a hot stock tip at a party. What do you do?',
    options: [
      { label: 'Ignore it — I stick to my plan', score: 1 },
      { label: 'Research it before deciding', score: 2 },
      { label: 'Move fast — opportunity waits for no one', score: 3 },
    ],
  },
  {
    q: 'Your portfolio drops 25% in a week. You…',
    options: [
      { label: 'Lose sleep and consider exiting', score: 1 },
      { label: 'Stay calm and re-evaluate', score: 2 },
      { label: 'Buy more while it is cheap', score: 3 },
    ],
  },
  {
    q: 'Your ideal investment horizon is…',
    options: [
      { label: '1–3 years', score: 1 },
      { label: '4–10 years', score: 2 },
      { label: '10+ years or until I am rich', score: 3 },
    ],
  },
  {
    q: 'What best describes your financial goal?',
    options: [
      { label: 'Protect what I have', score: 1 },
      { label: 'Steady, reliable growth', score: 2 },
      { label: 'Maximum returns, whatever it takes', score: 3 },
    ],
  },
  {
    q: 'You are building your portfolio. You pick…',
    options: [
      { label: 'Treasury bonds and blue chips', score: 1 },
      { label: 'Index funds and some individual stocks', score: 2 },
      { label: 'Crypto, startups, and high-growth tech', score: 3 },
    ],
  },
]

const PROFILES: Record<string, { name: string; description: string; riskProfile: RiskProfile }> = {
  guardian: {
    name: 'The Vault Guardian',
    description: 'You value capital protection above all. Steady and methodical, you sleep soundly knowing your wealth is safe.',
    riskProfile: RiskProfile.CONSERVATIVE,
  },
  pathfinder: {
    name: 'The Balanced Pathfinder',
    description: 'Calculated and composed, you seek growth without recklessness. You chart a thoughtful course through market terrain.',
    riskProfile: RiskProfile.MODERATE,
  },
  maverick: {
    name: 'The Quantum Maverick',
    description: 'Bold and conviction-driven, you bet big on high-conviction ideas. Volatility is your playground.',
    riskProfile: RiskProfile.AGGRESSIVE,
  },
}

const ASSET_CLASS_OPTIONS: { value: AssetClass; label: string }[] = [
  { value: AssetClass.CASH, label: 'Cash' },
  { value: AssetClass.STOCKS, label: 'Stocks' },
  { value: AssetClass.CRYPTO, label: 'Crypto' },
  { value: AssetClass.BONDS, label: 'Bonds' },
  { value: AssetClass.REAL_ESTATE, label: 'Real Estate' },
  { value: AssetClass.PRIVATE, label: 'Private Equity' },
]

// Assets where the user enters quantity + symbol (live price × qty = value)
const PRICE_TRACKED = [AssetClass.STOCKS, AssetClass.CRYPTO]

interface AssetRow {
  id: string
  assetClass: AssetClass
  name: string
  value: string     // for manually-valued asset classes
  quantity: string  // for stocks / crypto
  ticker: string    // finageSymbol (stocks) or coinGeckoId (crypto)
}

function newRow(): AssetRow {
  return {
    id: Math.random().toString(36).slice(2),
    assetClass: AssetClass.CASH,
    name: '', value: '', quantity: '', ticker: '',
  }
}

function classifyProfile(total: number) {
  if (total <= 8) return PROFILES.guardian
  if (total <= 12) return PROFILES.pathfinder
  return PROFILES.maverick
}

function isValid(r: AssetRow) {
  if (!r.name.trim()) return false
  if (PRICE_TRACKED.includes(r.assetClass)) return parseFloat(r.quantity) > 0
  return parseFloat(r.value) > 0
}

export default function SignupPage() {
  const [step, setStep] = useState<'info' | 'questionnaire' | 'result' | 'assets'>('info')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(Role.CLIENT)
  const [answers, setAnswers] = useState<number[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [profile, setProfile] = useState<(typeof PROFILES)[string] | null>(null)
  const [assetRows, setAssetRows] = useState<AssetRow[]>([newRow()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signedUpUserId, setSignedUpUserId] = useState<string | null>(null)
  useAuth()
  const router = useRouter()

  const validateInfo = (): string | null => {
    if (password.length < 6) return 'Password should be at least 6 characters.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address.'
    return null
  }

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const validationErr = validateInfo()
    if (validationErr) {
      setError(validationErr)
      return
    }
    if (role === Role.ADVISER) {
      setLoading(true)
      try {
        const { data, error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        if (!data.user) throw new Error('Signup failed')
        await supabase.from('profiles').insert({ id: data.user.id, name, email, role: 'adviser' })
        router.push('/adviser')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Signup failed')
        setLoading(false)
      }
    } else {
      setLoading(true)
      try {
        const { data, error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        if (!data.user) throw new Error('Signup failed')
        // Empty identities = email already registered (when confirmation is enabled)
        if (data.user.identities && data.user.identities.length === 0) {
          setError('User already registered')
          setLoading(false)
          return
        }
        setSignedUpUserId(data.user.id)
        setStep('questionnaire')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Signup failed')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleAnswer = (score: number) => {
    const next = [...answers, score]
    if (currentQ < QUESTIONS.length - 1) {
      setAnswers(next); setCurrentQ(q => q + 1)
    } else {
      setProfile(classifyProfile(next.reduce((s, v) => s + v, 0)))
      setStep('result')
    }
  }

  const updateRow = (id: string, field: keyof AssetRow, val: string) =>
    setAssetRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r))

  const removeRow = (id: string) =>
    setAssetRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev)

  const validRows = assetRows.filter(isValid)
  const manualTotal = validRows
    .filter(r => !PRICE_TRACKED.includes(r.assetClass))
    .reduce((s, r) => s + parseFloat(r.value || '0'), 0)
  const liveCount = validRows.filter(r => PRICE_TRACKED.includes(r.assetClass)).length

  /** Copy template assets for the given risk profile into the new portfolio. Single batch insert. */
  const copyTemplateToPortfolio = async (portfolioId: string, riskProfile: string) => {
    const { data: templates } = await supabase
      .from('portfolio_templates')
      .select('*')
      .eq('risk_profile', riskProfile)
      .order('sort_order')

    const rows = templates?.length
      ? templates.map(t => ({
          portfolio_id: portfolioId,
          name: t.name,
          asset_class: t.asset_class,
          value: Number(t.value) || 0,
          currency: t.currency ?? 'USD',
          quantity: t.quantity != null ? Number(t.quantity) : null,
          finage_symbol: t.finage_symbol ?? null,
          coin_gecko_id: t.coin_gecko_id ?? null,
          is_crypto: Boolean(t.is_crypto),
        }))
      : [{ portfolio_id: portfolioId, name: 'Cash', asset_class: 'cash', value: 0, currency: 'USD', quantity: null, finage_symbol: null, coin_gecko_id: null, is_crypto: false }]

    await supabase.from('assets').insert(rows)
    return rows.reduce((s, a) => s + a.value, 0)
  }

  const handleComplete = async (skip = false) => {
    if (!profile) return
    const validationErr = validateInfo()
    if (validationErr) {
      setError(validationErr)
      return
    }
    if (!signedUpUserId) {
      setError('Session expired. Please go back and try again.')
      return
    }
    setLoading(true); setError('')
    try {
      const userId = signedUpUserId

      await supabase.from('profiles').insert({
        id: userId, name, email,
        role: 'client',
        risk_profile: profile.riskProfile,
        investor_profile: profile.name,
      })

      const { data: portfolioData } = await supabase
        .from('portfolios')
        .insert({ client_id: userId, total_value: 0 })
        .select().single()

      if (portfolioData && !skip) {
        const rows = validRows
        if (rows.length > 0) {
          // User entered assets — insert them
          const inserts = rows.map(r => {
            let value = 0
            if (!PRICE_TRACKED.includes(r.assetClass)) {
              value = parseFloat(r.value ?? '0') || 0
            }
            return {
              portfolio_id: portfolioData.id,
              name: r.name.trim(),
              asset_class: r.assetClass,
              value,
              currency: 'USD',
              quantity: PRICE_TRACKED.includes(r.assetClass) ? parseFloat(r.quantity) : null,
              finage_symbol: r.assetClass === AssetClass.STOCKS && r.ticker ? r.ticker.toUpperCase() : null,
              coin_gecko_id: r.assetClass === AssetClass.CRYPTO && r.ticker ? r.ticker.toLowerCase() : null,
              is_crypto: r.assetClass === AssetClass.CRYPTO,
            }
          })

          await supabase.from('assets').insert(inserts)
          const totalValue = inserts.reduce((s, a) => s + a.value, 0)
          await supabase.from('portfolios').update({ total_value: totalValue }).eq('id', portfolioData.id)
        }
      } else if (portfolioData && skip) {
        // Skip: use pre-built template for instant populated dashboard
        const totalValue = await copyTemplateToPortfolio(portfolioData.id, profile.riskProfile)
        await supabase.from('portfolios').update({ total_value: totalValue }).eq('id', portfolioData.id)
      }

      await supabase.auth.signInWithPassword({ email, password })
      router.push(`/client/${userId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const stepLabel = { info: 'Create account', questionnaire: 'Investor profile', result: 'Your profile', assets: 'Add your assets' }[step]
  const stepSub = { info: 'Start your wellness journey', questionnaire: `Question ${currentQ + 1} of ${QUESTIONS.length}`, result: 'Based on your answers', assets: 'Tell us what you own' }[step]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:py-10 sm:px-6" style={{ background: '#080808' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="w-full max-w-sm sm:max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: GOLD, color: '#080808' }}>H</div>
            <span className="text-base font-bold tracking-tight">Huat</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">{stepLabel}</h1>
          <p className="text-sm text-white/40 mt-1">{stepSub}</p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Basic info ── */}
          {step === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="rounded-2xl p-6" style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}>
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">Full name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none placeholder-white/20"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none placeholder-white/20"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none placeholder-white/20"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-2">I am a</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ value: Role.CLIENT, label: 'Client', sub: 'View my portfolio' }, { value: Role.ADVISER, label: 'Adviser', sub: 'Manage clients' }].map(r => (
                        <button key={r.value} type="button" onClick={() => setRole(r.value)}
                          className="p-3 rounded-xl text-left transition-all"
                          style={{ background: role === r.value ? 'rgba(201,162,39,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${role === r.value ? 'rgba(201,162,39,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                          <p className="text-sm font-semibold" style={{ color: role === r.value ? GOLD : 'rgba(255,255,255,0.7)' }}>{r.label}</p>
                          <p className="text-xs text-white/35 mt-0.5">{r.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 mt-1"
                    style={{ background: GOLD, color: '#080808' }}>
                    {loading ? 'Creating…' : role === Role.CLIENT ? 'Continue' : 'Create account'}
                  </button>
                </form>
              </div>
              <p className="text-center text-xs text-white/30 mt-5">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-white/60 hover:text-white transition-colors">Sign in</Link>
              </p>
            </motion.div>
          )}

          {/* ── Step 2: Questionnaire ── */}
          {step === 'questionnaire' && (() => {
            const qIndex = Math.min(Math.max(0, currentQ), QUESTIONS.length - 1)
            const question = QUESTIONS[qIndex]
            if (!question) return null
            return (
            <motion.div key={`q-${qIndex}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
              <div className="mb-5">
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(qIndex / QUESTIONS.length) * 100}%`, background: GOLD }} />
                </div>
              </div>
              <div className="rounded-2xl p-6" style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-sm font-semibold text-white mb-5 leading-snug">{question.q}</p>
                <div className="space-y-2.5">
                  {question.options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(opt.score)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/70 transition-all hover:text-white"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,162,39,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,162,39,0.25)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {qIndex > 0 && (
                <button onClick={() => { setAnswers(prev => prev.slice(0, -1)); setCurrentQ(q => q - 1) }}
                  className="mt-4 text-xs text-white/30 hover:text-white/60 transition-colors">Back</button>
              )}
            </motion.div>
            );
          })()}

          {/* ── Step 3: Result ── */}
          {step === 'result' && profile && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <div className="rounded-2xl p-6 text-center" style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)' }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-1">Your investor profile</p>
                <h2 className="text-xl font-bold mb-3" style={{ color: GOLD }}>{profile.name}</h2>
                <p className="text-sm text-white/50 leading-relaxed mb-6">{profile.description}</p>
                <div className="rounded-xl px-4 py-2.5 mb-6 text-left" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/35">Risk profile mapped to</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: profile.riskProfile === RiskProfile.CONSERVATIVE ? 'rgba(16,185,129,0.12)' : profile.riskProfile === RiskProfile.MODERATE ? 'rgba(201,162,39,0.12)' : 'rgba(239,68,68,0.12)', color: profile.riskProfile === RiskProfile.CONSERVATIVE ? '#10B981' : profile.riskProfile === RiskProfile.MODERATE ? '#C9A227' : '#EF4444' }}>
                      {profile.riskProfile}
                    </span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <button onClick={() => setStep('assets')}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: GOLD, color: '#080808' }}>
                    Add my assets
                  </button>
                  <button
                    onClick={() => handleComplete(true)}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 border"
                    style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
                    {loading ? 'Setting up…' : 'Start with sample portfolio — jump straight in'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Asset entry ── */}
          {step === 'assets' && (
            <motion.div key="assets" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
              <button
                onClick={() => setStep('result')}
                className="mb-4 text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5"
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="rounded-2xl p-5" style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}>

                <div className="space-y-2.5 mb-3">
                  {assetRows.map((row) => {
                    const tracked = PRICE_TRACKED.includes(row.assetClass)
                    return (
                      <div key={row.id} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {/* Class + delete */}
                        <div className="flex items-center gap-2">
                          <select value={row.assetClass} onChange={e => updateRow(row.id, 'assetClass', e.target.value)}
                            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg outline-none text-white appearance-none cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {ASSET_CLASS_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1a1a' }}>{o.label}</option>)}
                          </select>
                          <button onClick={() => removeRow(row.id)} disabled={assetRows.length === 1}
                            className="text-white/20 hover:text-white/60 transition-colors disabled:opacity-20 flex-shrink-0">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>

                        {/* Name */}
                        <input type="text" value={row.name ?? ''} onChange={e => updateRow(row.id, 'name', e.target.value)}
                          placeholder="Asset name (e.g. Apple shares)"
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg outline-none text-white placeholder-white/20"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />

                        {/* Value input: quantity+ticker for stocks/crypto, $ for others */}
                        {tracked ? (
                          <div className="flex gap-2 min-w-0">
                            <input type="text" value={row.ticker ?? ''} onChange={e => updateRow(row.id, 'ticker', e.target.value)}
                              placeholder={row.assetClass === AssetClass.STOCKS ? 'Ticker, e.g. AAPL' : 'Coin ID, e.g. bitcoin'}
                              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg outline-none text-white placeholder-white/20"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
                            <div className="relative flex-shrink-0">
                              <input type="number" value={row.quantity ?? ''} onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                                placeholder="Qty" min="0" step="any"
                                className="w-20 px-2.5 py-1.5 text-xs rounded-lg outline-none text-white placeholder-white/20"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span>
                            <input type="number" value={row.value ?? ''} onChange={e => updateRow(row.id, 'value', e.target.value)}
                              placeholder="0" min="0"
                              className="w-full pl-6 pr-2.5 py-1.5 text-xs rounded-lg outline-none text-white placeholder-white/20"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <button onClick={() => setAssetRows(prev => [...prev, newRow()])}
                  className="w-full py-2 rounded-xl text-xs text-white/35 hover:text-white/60 transition-colors mb-4"
                  style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  + Add another asset
                </button>

                {/* Total preview */}
                {(manualTotal > 0 || liveCount > 0) && (
                  <div className="rounded-xl px-3.5 py-2.5 mb-4 space-y-1" style={{ background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.15)' }}>
                    {manualTotal > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">Manual assets</span>
                        <span className="text-xs font-semibold" style={{ color: GOLD }}>
                          ${manualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {liveCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">Live-priced assets</span>
                        <span className="text-xs font-medium text-white/50">{liveCount} × live price</span>
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

                <button onClick={() => handleComplete(false)} disabled={loading || validRows.length === 0}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: GOLD, color: '#080808' }}>
                  {loading ? 'Setting up your dashboard…' : 'Enter my dashboard'}
                </button>
              </div>

              <button onClick={() => handleComplete(true)} disabled={loading}
                className="block mx-auto mt-4 text-xs text-white/25 hover:text-white/50 transition-colors">
                Skip for now
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}
