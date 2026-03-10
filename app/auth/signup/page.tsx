'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Confetti from 'react-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { supabase } from '@/lib/supabase'
import { Role, RiskProfile, AssetClass } from '@/types'
import { GlowingEffect } from '@/components/ui/glowing-effect'
import shieldIcon from '@/shield.webp'
import knightIcon from '@/knight.webp'
import wizardIcon from '@/wizard.webp'

const C = {
  bg:    '#0D0D0D',
  deep:  '#1A1E24',
  mid:   '#948979',
  light: '#DFD0B8',
  deepA:  (a: number) => `rgba(26,30,36,${a})`,
  midA:   (a: number) => `rgba(148,137,121,${a})`,
  lightA: (a: number) => `rgba(223,208,184,${a})`,
}

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
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [usernameChecking, setUsernameChecking] = useState(false)
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
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const { login } = useAuth()
  const router = useRouter()

  // Check username availability via the server-side API route (bypasses RLS for unauthed users)
  const checkUsername = async (value: string): Promise<boolean> => {
    const normalized = value.toLowerCase().trim()
    if (!normalized) { setUsernameError('Profile name is required.'); return false }
    setUsernameChecking(true)
    setUsernameError('')
    try {
      const res = await fetch(`/api/check-username?username=${encodeURIComponent(normalized)}`)
      const json: { available: boolean; error?: string } = await res.json()
      if (json.error) { setUsernameError(json.error); return false }
      if (!json.available) { setUsernameError('That profile name is already taken. Please choose another.'); return false }
      return true
    } finally {
      setUsernameChecking(false)
    }
  }

  const validateInfo = (): string | null => {
    if (!username.trim()) return 'Profile name is required.'
    if (password.length < 6) return 'Password should be at least 6 characters.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address.'
    return null
  }

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const validationErr = validateInfo()
    if (validationErr) { setError(validationErr); return }
    // Re-check username availability right before creating the account
    const usernameAvailable = await checkUsername(username)
    if (!usernameAvailable) return
    if (role === Role.ADVISER) {
      setLoading(true)
      try {
        const { data, error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        if (!data.user) throw new Error('Signup failed')
        // Duplicate email: Supabase returns the existing user with empty identities
        if (data.user.identities && data.user.identities.length === 0) {
          setError('An account with this email already exists.')
          setLoading(false)
          return
        }
        const { error: profileErr } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, name, email, role: 'adviser', username: username.toLowerCase().trim() })
        if (profileErr) {
          // Unique constraint violation — race condition where another user claimed the name
          if (profileErr.code === '23505') throw new Error('That profile name was just taken. Please choose another.')
          throw new Error(profileErr.message)
        }
        // Use login() so AuthContext.user is set before navigating
        await login(email, password)
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
          setError('An account with this email already exists.')
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
    if (!profile || !signedUpUserId) {
      setError('Session expired. Please go back and try again.')
      return
    }
    setLoading(true); setError('')
    try {
      const userId = signedUpUserId
      // Pre-generate portfolioId so we can parallelise the two inserts
      const portfolioId = crypto.randomUUID()

      // Build asset rows upfront so we know the total before any DB call
      const assetInserts = skip || validRows.length === 0 ? [] : validRows.map(r => ({
        portfolio_id: portfolioId,
        name: r.name.trim(),
        asset_class: r.assetClass,
        value: PRICE_TRACKED.includes(r.assetClass) ? 0 : parseFloat(r.value ?? '0') || 0,
        currency: 'USD',
        quantity: PRICE_TRACKED.includes(r.assetClass) ? parseFloat(r.quantity) : null,
        finage_symbol: r.assetClass === AssetClass.STOCKS && r.ticker ? r.ticker.toUpperCase() : null,
        coin_gecko_id: r.assetClass === AssetClass.CRYPTO && r.ticker ? r.ticker.toLowerCase() : null,
        is_crypto: r.assetClass === AssetClass.CRYPTO,
      }))
      const manualTotal = assetInserts.reduce((s, a) => s + a.value, 0)

      // Round 1 (parallel): create profile + portfolio simultaneously
      await Promise.all([
        supabase.from('profiles').insert({
          id: userId, name, email,
          role: 'client',
          risk_profile: profile.riskProfile,
          investor_profile: profile.name,
          username: username.toLowerCase().trim(),
        }).then(({ error: profileErr }) => {
          if (profileErr) {
            if (profileErr.code === '23505') throw new Error('That profile name was just taken. Please choose another.')
            throw new Error(profileErr.message)
          }
        }),
        supabase.from('portfolios').insert({
          id: portfolioId,
          client_id: userId,
          total_value: manualTotal,
        }),
      ])

      // Round 2: insert assets (user-entered or template)
      if (skip) {
        // copyTemplateToPortfolio inserts the assets and returns the real total —
        // update the portfolio row so total_value reflects the template data
        const templateTotal = await copyTemplateToPortfolio(portfolioId, profile.riskProfile)
        await supabase.from('portfolios').update({ total_value: templateTotal }).eq('id', portfolioId)
      } else if (assetInserts.length > 0) {
        await supabase.from('assets').insert(assetInserts)
      }

      // login() signs in AND sets AuthContext.user — page.tsx fast path kicks in immediately
      await login(email, password)
      router.push(`/client/${userId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const stepLabel = { info: 'Create account', questionnaire: 'Investor profile', result: 'Your profile', assets: 'Add your assets' }[step]
  const stepSub = { info: 'Start your wellness journey', questionnaire: `Question ${currentQ + 1} of ${QUESTIONS.length}`, result: 'Based on your answers', assets: 'Tell us what you own' }[step]

  // Confetti: run once when archetype result is shown; need client-side dimensions for SSR
  useEffect(() => {
    if (typeof window === 'undefined') return
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
  }, [])
  const showConfetti = step === 'result' && windowSize.width > 0 && windowSize.height > 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 pt-16 pb-10 sm:pb-14 sm:px-6" style={{ background: C.bg }}>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={400}
          recycle={false}
          gravity={0.2}
          colors={[C.light, C.mid, '#6EC4A5', C.deep, '#DFD0B8', '#948979']}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="w-full max-w-sm sm:max-w-md"
      >
        <div className="text-center mb-4">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: C.light, color: C.bg }}>H</div>
            <span className="font-ballet text-sm text-white" style={{ lineHeight: 1 }}>Huat</span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>{stepLabel}</h1>
          <p className="text-xs mt-0.5" style={{ color: C.midA(0.8) }}>{stepSub}</p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Basic info ── */}
          {step === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              <div className="relative rounded-2xl p-6" style={{ background: `linear-gradient(145deg, ${C.deepA(0.9)} 0%, rgba(13,13,13,0.97) 100%)`, border: `1px solid ${C.midA(0.2)}` }}>
                <GlowingEffect spread={50} glow={false} disabled={false} proximity={100} inactiveZone={0.05} borderWidth={2} />
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.midA(0.65) }}>Full name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none placeholder-white/20"
                      style={{ background: C.deepA(0.6), border: `1px solid ${C.midA(0.18)}` }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.midA(0.65) }}>
                      Profile name
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs select-none" style={{ color: C.midA(0.4) }}>@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={e => {
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))
                          setUsernameError('')
                        }}
                        onBlur={() => { if (username.trim()) checkUsername(username) }}
                        required
                        placeholder="jane.doe"
                        maxLength={20}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className="w-full pl-7 pr-9 py-2.5 rounded-xl text-sm text-white outline-none placeholder-white/20"
                        style={{
                          background: C.deepA(0.6),
                          border: `1px solid ${usernameError ? 'rgba(239,68,68,0.4)' : C.midA(0.18)}`,
                        }}
                      />
                      {/* Availability indicator */}
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameChecking && (
                          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.midA(0.4)} strokeWidth="2.5">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                          </svg>
                        )}
                        {!usernameChecking && username.trim() && !usernameError && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6EC4A5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                    </div>
                    {usernameError && (
                      <p className="text-xs text-red-400 mt-1.5 px-0.5">{usernameError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.midA(0.65) }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none placeholder-white/20"
                      style={{ background: C.deepA(0.6), border: `1px solid ${C.midA(0.18)}` }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: C.midA(0.65) }}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none placeholder-white/20"
                      style={{ background: C.deepA(0.6), border: `1px solid ${C.midA(0.18)}` }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: C.midA(0.65) }}>I am a</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ value: Role.CLIENT, label: 'Client', sub: 'View my portfolio' }, { value: Role.ADVISER, label: 'Adviser', sub: 'Manage clients' }].map(r => (
                        <div key={r.value} className="relative rounded-xl">
                          <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                          <button type="button" onClick={() => setRole(r.value)}
                            className="relative w-full p-3 rounded-xl text-left transition-all"
                            style={{ background: role === r.value ? C.lightA(0.07) : C.deepA(0.5), border: `1px solid ${role === r.value ? C.lightA(0.3) : C.midA(0.14)}` }}>
                            <p className="text-sm font-semibold" style={{ color: role === r.value ? C.light : C.midA(0.7) }}>{r.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: C.midA(0.45) }}>{r.sub}</p>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <div className="relative rounded-xl mt-1">
                    <GlowingEffect spread={30} glow={false} disabled={false} proximity={60} inactiveZone={0.01} borderWidth={2} />
                    <button type="submit" disabled={loading}
                      className="relative w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${C.mid} 0%, ${C.deep} 100%)`, color: C.light, boxShadow: `0 0 24px ${C.midA(0.2)}` }}>
                      {loading ? 'Creating…' : role === Role.CLIENT ? 'Continue' : 'Create account'}
                    </button>
                  </div>
                </form>
              </div>
              <div
                className="relative mt-3 rounded-2xl px-6 py-3.5 text-center text-xs"
                style={{
                  background: `linear-gradient(145deg, ${C.deepA(0.85)} 0%, rgba(13,13,13,0.95) 100%)`,
                  border: `1px solid ${C.midA(0.16)}`,
                  color: C.midA(0.45),
                }}
              >
                <GlowingEffect spread={50} glow={false} disabled={false} proximity={80} inactiveZone={0.05} borderWidth={2} />
                Already have an account?{' '}
                <Link href="/auth/login" className="transition-colors font-medium" style={{ color: C.midA(0.75) }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.light)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.midA(0.75))}>Sign in</Link>
              </div>
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
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: C.midA(0.12) }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(qIndex / QUESTIONS.length) * 100}%`, background: `linear-gradient(90deg, ${C.mid}, ${C.light})` }} />
                </div>
              </div>
              <div className="relative rounded-2xl p-6" style={{ background: `linear-gradient(145deg, ${C.deepA(0.9)} 0%, rgba(13,13,13,0.97) 100%)`, border: `1px solid ${C.midA(0.2)}` }}>
                <GlowingEffect spread={50} glow={false} disabled={false} proximity={100} inactiveZone={0.05} borderWidth={2} />
                <p className="text-sm font-semibold text-white mb-5 leading-snug">{question.q}</p>
                <div className="space-y-2.5">
                  {question.options.map((opt, i) => (
                    <div key={i} className="relative rounded-xl">
                      <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
                      <button onClick={() => handleAnswer(opt.score)}
                        className="relative w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                        style={{ background: C.deepA(0.5), border: `1px solid ${C.midA(0.14)}`, color: C.midA(0.75) }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.deepA(0.8); (e.currentTarget as HTMLElement).style.borderColor = C.lightA(0.25); (e.currentTarget as HTMLElement).style.color = C.light }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.deepA(0.5); (e.currentTarget as HTMLElement).style.borderColor = C.midA(0.14); (e.currentTarget as HTMLElement).style.color = C.midA(0.75) }}>
                        {opt.label}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {qIndex > 0 && (
                <button onClick={() => { setAnswers(prev => prev.slice(0, -1)); setCurrentQ(q => q - 1) }}
                  className="mt-4 text-xs transition-colors" style={{ color: C.midA(0.4) }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.midA(0.7))}
                  onMouseLeave={e => (e.currentTarget.style.color = C.midA(0.4))}>Back</button>
              )}
            </motion.div>
            );
          })()}

          {/* ── Step 3: Result ── */}
          {step === 'result' && profile && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <div className="relative rounded-2xl p-6 text-center" style={{ background: `linear-gradient(145deg, ${C.deepA(0.9)} 0%, rgba(13,13,13,0.97) 100%)`, border: `1px solid ${C.midA(0.2)}` }}>
                <GlowingEffect spread={50} glow={false} disabled={false} proximity={100} inactiveZone={0.05} borderWidth={2} />
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden"
                  style={{ background: 'rgba(0,0,0,0.7)', border: `1px solid ${C.lightA(0.2)}` }}
                >
                  <Image
                    src={
                      profile.riskProfile === RiskProfile.CONSERVATIVE
                        ? shieldIcon
                        : profile.riskProfile === RiskProfile.MODERATE
                          ? knightIcon
                          : wizardIcon
                    }
                    alt={profile.name}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.midA(0.8) }}>Your investor profile</p>
                <h2 className="text-xl font-bold mb-3" style={{ color: C.light }}>{profile.name}</h2>
                <p className="text-sm leading-relaxed mb-6" style={{ color: C.midA(0.8) }}>{profile.description}</p>
                <div className="rounded-xl px-4 py-2.5 mb-6 text-left" style={{ background: C.deepA(0.5), border: `1px solid ${C.midA(0.14)}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: C.midA(0.8) }}>Risk profile mapped to</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: profile.riskProfile === RiskProfile.CONSERVATIVE ? 'rgba(110,196,165,0.12)' : profile.riskProfile === RiskProfile.MODERATE ? C.lightA(0.1) : 'rgba(239,68,68,0.12)', color: profile.riskProfile === RiskProfile.CONSERVATIVE ? '#6EC4A5' : profile.riskProfile === RiskProfile.MODERATE ? C.light : '#EF7A7A' }}>
                      {profile.riskProfile}
                    </span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="relative rounded-xl">
                    <GlowingEffect spread={30} glow={false} disabled={false} proximity={60} inactiveZone={0.01} borderWidth={2} />
                    <button onClick={() => setStep('assets')}
                      className="relative w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, ${C.mid} 0%, ${C.deep} 100%)`, color: C.light, boxShadow: `0 0 24px ${C.midA(0.2)}` }}>
                      Add my assets
                    </button>
                  </div>
                  <div className="relative rounded-xl">
                    <GlowingEffect spread={25} glow={false} disabled={false} proximity={50} inactiveZone={0.01} borderWidth={1} />
                    <button
                      onClick={() => handleComplete(true)}
                      disabled={loading}
                      className="relative w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 border"
                      style={{ background: 'transparent', color: C.midA(0.7), borderColor: C.midA(0.25) }}>
                      {loading ? 'Setting up…' : 'Start with sample portfolio — jump straight in'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Asset entry ── */}
          {step === 'assets' && (
            <motion.div key="assets" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
              <button
                onClick={() => setStep('result')}
                className="mb-4 text-xs transition-colors flex items-center gap-1.5"
                style={{ color: C.midA(0.4) }}
                onMouseEnter={e => (e.currentTarget.style.color = C.midA(0.7))}
                onMouseLeave={e => (e.currentTarget.style.color = C.midA(0.4))}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="relative rounded-2xl p-5" style={{ background: `linear-gradient(145deg, ${C.deepA(0.9)} 0%, rgba(13,13,13,0.97) 100%)`, border: `1px solid ${C.midA(0.2)}` }}>
                <GlowingEffect spread={50} glow={false} disabled={false} proximity={100} inactiveZone={0.05} borderWidth={2} />

                <div className="space-y-2.5 mb-3">
                  {assetRows.map((row) => {
                    const tracked = PRICE_TRACKED.includes(row.assetClass)
                    return (
                      <div key={row.id} className="rounded-xl p-3 space-y-2" style={{ background: C.deepA(0.5), border: `1px solid ${C.midA(0.14)}` }}>
                        {/* Class + delete */}
                        <div className="flex items-center gap-2">
                          <select value={row.assetClass} onChange={e => updateRow(row.id, 'assetClass', e.target.value)}
                            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg outline-none text-white appearance-none cursor-pointer"
                            style={{ background: C.deepA(0.8), border: `1px solid ${C.midA(0.18)}` }}>
                            {ASSET_CLASS_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1a1a' }}>{o.label}</option>)}
                          </select>
                          <button onClick={() => removeRow(row.id)} disabled={assetRows.length === 1}
                            className="transition-colors disabled:opacity-20 flex-shrink-0" style={{ color: C.midA(0.35) }}
                            onMouseEnter={e => (e.currentTarget.style.color = C.midA(0.7))}
                            onMouseLeave={e => (e.currentTarget.style.color = C.midA(0.35))}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>

                        {/* Name */}
                        <input type="text" value={row.name ?? ''} onChange={e => updateRow(row.id, 'name', e.target.value)}
                          placeholder="Asset name (e.g. Apple shares)"
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg outline-none text-white placeholder-white/20"
                          style={{ background: C.deepA(0.6), border: `1px solid ${C.midA(0.16)}` }} />

                        {/* Value input: quantity+ticker for stocks/crypto, $ for others */}
                        {tracked ? (
                          <div className="flex gap-2 min-w-0">
                            <input type="text" value={row.ticker ?? ''} onChange={e => updateRow(row.id, 'ticker', e.target.value)}
                              placeholder={row.assetClass === AssetClass.STOCKS ? 'Ticker, e.g. AAPL' : 'Coin ID, e.g. bitcoin'}
                              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg outline-none text-white placeholder-white/20"
                              style={{ background: C.deepA(0.6), border: `1px solid ${C.midA(0.16)}` }} />
                            <div className="relative flex-shrink-0">
                              <input type="number" value={row.quantity ?? ''} onChange={e => updateRow(row.id, 'quantity', e.target.value)}
                                placeholder="Qty" min="0" step="any"
                                className="w-20 px-2.5 py-1.5 text-xs rounded-lg outline-none text-white placeholder-white/20"
                                style={{ background: C.deepA(0.6), border: `1px solid ${C.midA(0.16)}` }} />
                            </div>
                          </div>
                        ) : (
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: C.midA(0.45) }}>$</span>
                            <input type="number" value={row.value ?? ''} onChange={e => updateRow(row.id, 'value', e.target.value)}
                              placeholder="0" min="0"
                              className="w-full pl-6 pr-2.5 py-1.5 text-xs rounded-lg outline-none text-white placeholder-white/20"
                              style={{ background: C.deepA(0.6), border: `1px solid ${C.midA(0.16)}` }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <button onClick={() => setAssetRows(prev => [...prev, newRow()])}
                  className="w-full py-2 rounded-xl text-xs transition-colors mb-4"
                  style={{ border: `1px dashed ${C.midA(0.2)}`, color: C.midA(0.45) }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.light)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.midA(0.45))}>
                  + Add another asset
                </button>

                {/* Total preview */}
                {(manualTotal > 0 || liveCount > 0) && (
                  <div className="rounded-xl px-3.5 py-2.5 mb-4 space-y-1" style={{ background: C.lightA(0.05), border: `1px solid ${C.lightA(0.15)}` }}>
                    {manualTotal > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: C.midA(0.5) }}>Manual assets</span>
                        <span className="text-xs font-semibold" style={{ color: C.light }}>
                          ${manualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {liveCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: C.midA(0.5) }}>Live-priced assets</span>
                        <span className="text-xs font-medium" style={{ color: C.midA(0.6) }}>{liveCount} × live price</span>
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

                <div className="relative rounded-xl">
                  <GlowingEffect spread={30} glow={false} disabled={false} proximity={60} inactiveZone={0.01} borderWidth={2} />
                  <button onClick={() => handleComplete(false)} disabled={loading || validRows.length === 0}
                    className="relative w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg, ${C.mid} 0%, ${C.deep} 100%)`, color: C.light, boxShadow: `0 0 24px ${C.midA(0.2)}` }}>
                    {loading ? 'Setting up your dashboard…' : 'Enter my dashboard'}
                  </button>
                </div>
              </div>

              <div className="relative rounded-lg mx-auto w-fit mt-4">
                <GlowingEffect spread={15} glow={false} disabled={false} proximity={30} inactiveZone={0.01} borderWidth={1} />
                <button onClick={() => handleComplete(true)} disabled={loading}
                  className="relative text-xs transition-colors px-2 py-1 rounded-lg"
                  style={{ color: C.midA(0.4) }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.midA(0.7))}
                  onMouseLeave={e => (e.currentTarget.style.color = C.midA(0.4))}>
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}
