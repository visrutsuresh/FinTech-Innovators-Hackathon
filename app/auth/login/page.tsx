'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { Role } from '@/types'

const GOLD = '#C9A227'

const DEMO_ACCOUNTS = [
  { email: 'adviser@demo.com', label: 'David Koh', role: 'Adviser' },
  { email: 'alex@demo.com', label: 'Alex Chen', role: 'Client · Aggressive' },
  { email: 'sarah@demo.com', label: 'Sarah Lim', role: 'Client · Moderate' },
  { email: 'raymond@demo.com', label: 'Raymond Wong', role: 'Client · Conservative' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-6 sm:py-10 sm:px-6"
      style={{ background: '#080808' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm sm:max-w-md"
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-sm text-white/40 mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none transition-all placeholder-white/20"
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

            {error && <p className="text-xs text-red-400 px-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 mt-2"
              style={{ background: GOLD, color: '#080808' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-xs text-white/25">or try a demo account</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div className="space-y-1.5">
            {DEMO_ACCOUNTS.map(d => (
              <button
                key={d.email}
                type="button"
                onClick={() => handleQuickLogin(d.email)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,162,39,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)')}
              >
                <div>
                  <p className="text-xs font-medium text-white/80">{d.label}</p>
                  <p className="text-xs text-white/35">{d.role}</p>
                </div>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-5">
          No account?{' '}
          <Link href="/auth/signup" className="text-white/60 hover:text-white transition-colors">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
