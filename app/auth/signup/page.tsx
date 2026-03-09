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

function classifyProfile(totalScore: number) {
  if (totalScore <= 8) return PROFILES.guardian
  if (totalScore <= 12) return PROFILES.pathfinder
  return PROFILES.maverick
}

export default function SignupPage() {
  const [step, setStep] = useState<'info' | 'questionnaire' | 'result'>('info')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(Role.CLIENT)
  const [answers, setAnswers] = useState<number[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [profile, setProfile] = useState<(typeof PROFILES)[string] | null>(null)
  const [loading, setLoading] = useState(false)
  useAuth() // ensures AuthProvider is mounted
  const router = useRouter()

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (role === Role.ADVISER) {
      setLoading(true)
      try {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.user) throw new Error('Signup failed')
        await supabase.from('profiles').insert({
          id: data.user.id, name, email, role: 'adviser',
        })
        // login() will be triggered by onAuthStateChange in AuthContext
        router.push('/adviser')
      } catch (err) {
        console.error(err)
        setLoading(false)
      }
    } else {
      setStep('questionnaire')
    }
  }

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score]
    if (currentQ < QUESTIONS.length - 1) {
      setAnswers(newAnswers)
      setCurrentQ(currentQ + 1)
    } else {
      // Final question answered
      const total = newAnswers.reduce((s, v) => s + v, 0)
      const classified = classifyProfile(total)
      setProfile(classified)
      setStep('result')
    }
  }

  const handleFinish = async () => {
    if (!profile) return
    setLoading(true)
    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      if (!data.user) throw new Error('Signup failed')

      const userId = data.user.id

      // Insert profile + portfolio in parallel (neither depends on the other)
      const [, portfolioResult] = await Promise.all([
        supabase.from('profiles').insert({
          id: userId, name, email,
          role: 'client',
          risk_profile: profile.riskProfile,
          investor_profile: profile.name,
        }),
        supabase.from('portfolios')
          .insert({ client_id: userId, total_value: 10000 })
          .select()
          .single(),
      ])

      // Insert starter asset (needs portfolio.id from above)
      if (portfolioResult.data) {
        await supabase.from('assets').insert({
          portfolio_id: portfolioResult.data.id,
          name: 'Cash',
          asset_class: AssetClass.CASH,
          value: 10000,
          currency: 'USD',
        })
      }

      // Re-sign-in so onAuthStateChange fires after DB records exist (profile load works)
      await supabase.auth.signInWithPassword({ email, password })
      router.push(`/client/${userId}`)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#080808' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ background: GOLD, color: '#080808' }}
            >
              H
            </div>
            <span className="text-base font-bold tracking-tight">Huat</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {step === 'info' ? 'Create account' : step === 'questionnaire' ? 'Investor profile' : 'Your profile'}
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {step === 'info' ? 'Start your wellness journey' : step === 'questionnaire' ? `Question ${currentQ + 1} of ${QUESTIONS.length}` : 'Based on your answers'}
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Basic info ─────────────────── */}
          {step === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div
                className="rounded-2xl p-6"
                style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">Full name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none placeholder-white/20"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none placeholder-white/20"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none placeholder-white/20"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-2">I am a</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: Role.CLIENT, label: 'Client', sub: 'View my portfolio' },
                        { value: Role.ADVISER, label: 'Adviser', sub: 'Manage clients' },
                      ].map(r => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className="p-3 rounded-xl text-left transition-all"
                          style={{
                            background: role === r.value ? 'rgba(201,162,39,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${role === r.value ? 'rgba(201,162,39,0.3)' : 'rgba(255,255,255,0.07)'}`,
                          }}
                        >
                          <p
                            className="text-sm font-semibold"
                            style={{ color: role === r.value ? GOLD : 'rgba(255,255,255,0.7)' }}
                          >
                            {r.label}
                          </p>
                          <p className="text-xs text-white/35 mt-0.5">{r.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 mt-1"
                    style={{ background: GOLD, color: '#080808' }}
                  >
                    {loading ? 'Creating…' : role === Role.CLIENT ? 'Continue' : 'Create account'}
                  </button>
                </form>
              </div>

              <p className="text-center text-xs text-white/30 mt-5">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-white/60 hover:text-white transition-colors">
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}

          {/* ── Step 2: Questionnaire ───────────────── */}
          {step === 'questionnaire' && (
            <motion.div
              key={`q-${currentQ}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              {/* Progress bar */}
              <div className="mb-5">
                <div
                  className="w-full h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${((currentQ) / QUESTIONS.length) * 100}%`, background: GOLD }}
                  />
                </div>
              </div>

              <div
                className="rounded-2xl p-6"
                style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-sm font-semibold text-white mb-5 leading-snug">
                  {QUESTIONS[currentQ].q}
                </p>

                <div className="space-y-2.5">
                  {QUESTIONS[currentQ].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(opt.score)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/70 transition-all hover:text-white"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(201,162,39,0.06)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,162,39,0.25)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {currentQ > 0 && (
                <button
                  onClick={() => {
                    setAnswers(prev => prev.slice(0, -1))
                    setCurrentQ(q => q - 1)
                  }}
                  className="mt-4 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Back
                </button>
              )}
            </motion.div>
          )}

          {/* ── Step 3: Result ─────────────────────── */}
          {step === 'result' && profile && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Profile icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)' }}
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>

                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-1">
                  Your investor profile
                </p>
                <h2 className="text-xl font-bold mb-3" style={{ color: GOLD }}>
                  {profile.name}
                </h2>
                <p className="text-sm text-white/50 leading-relaxed mb-6">
                  {profile.description}
                </p>

                <div
                  className="rounded-xl px-4 py-2.5 mb-6 text-left"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/35">Risk profile mapped to</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{
                        background: profile.riskProfile === RiskProfile.CONSERVATIVE ? 'rgba(16,185,129,0.12)' : profile.riskProfile === RiskProfile.MODERATE ? 'rgba(201,162,39,0.12)' : 'rgba(239,68,68,0.12)',
                        color: profile.riskProfile === RiskProfile.CONSERVATIVE ? '#10B981' : profile.riskProfile === RiskProfile.MODERATE ? '#C9A227' : '#EF4444',
                      }}
                    >
                      {profile.riskProfile}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: GOLD, color: '#080808' }}
                >
                  {loading ? 'Setting up your dashboard…' : 'Enter my dashboard'}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}
