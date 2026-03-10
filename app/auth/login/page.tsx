'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { Role } from '@/types'
import { GlowingEffect } from '@/components/ui/glowing-effect'

const GOLD = '#C9A227'

const DEMO_ACCOUNTS = [
  { email: 'adviser@demo.com', label: 'David Koh', role: 'Adviser', initials: 'DK', accent: '#457B9D' },
  { email: 'alex@demo.com', label: 'Alex Chen', role: 'Aggressive', initials: 'AC', accent: '#EF4444' },
  { email: 'sarah@demo.com', label: 'Sarah Lim', role: 'Moderate', initials: 'SL', accent: '#C9A227' },
  { email: 'raymond@demo.com', label: 'Raymond Wong', role: 'Conservative', initials: 'RW', accent: '#10B981' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      router.push(user.role === Role.ADVISER ? '/adviser' : `/client/${user.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.')
      setLoading(false)
    }
  }

  const handleQuickLogin = async (demoEmail: string) => {
    setError('')
    setLoading(true)
    try {
      const user = await login(demoEmail, 'demo123')
      router.push(user.role === Role.ADVISER ? '/adviser' : `/client/${user.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
      setLoading(false)
    }
  }

  const inputStyle = (field: string) => ({
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${focusedField === field ? 'rgba(201,162,39,0.4)' : 'rgba(255,255,255,0.08)'}`,
    transition: 'border-color 0.2s ease',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(201,162,39,0.08)' : 'none',
  })

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: '#080808' }}
    >
      {/* Background ambient */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 400,
          background: 'radial-gradient(ellipse, rgba(201,162,39,0.06) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-7 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-transform group-hover:scale-105"
              style={{ background: GOLD, color: '#080808' }}
            >
              H
            </div>
            <span className="font-ballet text-lg text-white" style={{ lineHeight: 1 }}>Huat</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1.5" style={{ letterSpacing: '-0.02em' }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Sign in to your wealth dashboard
          </p>
        </div>

        {/* Main card */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: '#0F0F0F',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}
        >
          <GlowingEffect spread={50} glow={false} disabled={false} proximity={100} inactiveZone={0.05} borderWidth={2} />
          {/* Form section */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none placeholder-white/20"
                  style={inputStyle('email')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none placeholder-white/20"
                  style={inputStyle('password')}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 px-1"
                >
                  {error}
                </motion.p>
              )}

              <div className="relative rounded-xl mt-1">
                <GlowingEffect spread={30} glow={false} disabled={false} proximity={60} inactiveZone={0.01} borderWidth={2} />
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
                style={{ background: GOLD, color: '#080808' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign in'}
              </button>
              </div>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-6" style={{ marginTop: -4 }}>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>or try a demo account</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>

          {/* Demo accounts */}
          <div className="p-6 pt-4 space-y-2">
            {DEMO_ACCOUNTS.map(d => (
              <div key={d.email} className="relative rounded-xl">
                <GlowingEffect spread={25} glow={false} disabled={false} proximity={50} inactiveZone={0.01} borderWidth={1} />
                <button
                  type="button"
                  onClick={() => handleQuickLogin(d.email)}
                  disabled={loading}
                  className="relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.055)'
                    e.currentTarget.style.borderColor = `${d.accent}30`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${d.accent}18`, color: d.accent }}
                  >
                    {d.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/85">{d.label}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>{d.role}</p>
                  </div>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
          No account?{' '}
          <Link
            href="/auth/signup"
            className="transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C9A227')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
          >
            Sign up free
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
