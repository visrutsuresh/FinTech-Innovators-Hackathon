'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { Role } from '@/types'
import { GlowingEffect } from '@/components/ui/glowing-effect'

const C = {
  bg:    '#0D0D0D',
  deep:  '#1A1E24',
  mid:   '#948979',
  light: '#DFD0B8',
  deepA:  (a: number) => `rgba(26,30,36,${a})`,
  midA:   (a: number) => `rgba(148,137,121,${a})`,
  lightA: (a: number) => `rgba(223,208,184,${a})`,
}

const DEMO_ACCOUNTS = [
  { email: 'adviser@demo.com', label: 'David Koh', role: 'Adviser', initials: 'DK', accent: '#7BAEC4' },
  { email: 'alex@demo.com', label: 'Alex Chen', role: 'Aggressive', initials: 'AC', accent: '#EF7A7A' },
  { email: 'sarah@demo.com', label: 'Sarah Lim', role: 'Moderate', initials: 'SL', accent: '#DFD0B8' },
  { email: 'raymond@demo.com', label: 'Raymond Wong', role: 'Conservative', initials: 'RW', accent: '#6EC4A5' },
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
    background: C.deepA(0.6),
    border: `1px solid ${focusedField === field ? C.lightA(0.4) : C.midA(0.18)}`,
    transition: 'border-color 0.2s ease',
    boxShadow: focusedField === field ? `0 0 0 3px ${C.lightA(0.08)}` : 'none',
  })

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-4 pt-16 pb-10"
      style={{ background: C.bg }}
    >
      {/* Background ambient */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          height: 500,
          background: `radial-gradient(ellipse, ${C.midA(0.1)} 0%, ${C.deepA(0.4)} 40%, transparent 70%)`,
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
        <div className="text-center mb-4">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-transform group-hover:scale-105"
              style={{ background: C.light, color: C.bg }}
            >
              H
            </div>
            <span className="font-ballet text-sm text-white" style={{ lineHeight: 1 }}>Huat</span>
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight mb-0.5" style={{ letterSpacing: '-0.02em' }}>
            Welcome back
          </h1>
          <p className="text-xs" style={{ color: C.midA(0.6) }}>
            Sign in to your wealth dashboard
          </p>
        </div>

        {/* Main card */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${C.deepA(0.9)} 0%, rgba(13,13,13,0.97) 100%)`,
            border: `1px solid ${C.midA(0.2)}`,
            boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${C.midA(0.06)}`,
          }}
        >
          <GlowingEffect spread={50} glow={false} disabled={false} proximity={100} inactiveZone={0.05} borderWidth={2} />
          {/* Form section */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: C.midA(0.65) }}>
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
                <label className="block text-xs font-medium mb-2" style={{ color: C.midA(0.65) }}>
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
                style={{ background: `linear-gradient(135deg, ${C.mid} 0%, ${C.deep} 100%)`, color: C.light, boxShadow: `0 0 24px ${C.midA(0.2)}` }}
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
            <div className="flex-1 h-px" style={{ background: C.midA(0.12) }} />
            <span className="text-xs" style={{ color: C.midA(0.4) }}>or try a demo account</span>
            <div className="flex-1 h-px" style={{ background: C.midA(0.12) }} />
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
                  style={{ background: C.deepA(0.5), border: `1px solid ${C.midA(0.14)}` }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = C.deepA(0.8)
                    e.currentTarget.style.borderColor = `${d.accent}40`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = C.deepA(0.5)
                    e.currentTarget.style.borderColor = C.midA(0.14)
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${d.accent}18`, color: d.accent }}
                  >
                    {d.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: C.light }}>{d.label}</p>
                    <p className="text-xs" style={{ color: C.midA(0.5) }}>{d.role}</p>
                  </div>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={C.midA(0.35)} strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
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
          No account?{' '}
          <Link
            href="/auth/signup"
            className="transition-colors font-medium"
            style={{ color: C.midA(0.75) }}
            onMouseEnter={e => (e.currentTarget.style.color = C.light)}
            onMouseLeave={e => (e.currentTarget.style.color = C.midA(0.75))}
          >
            Sign up free
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
