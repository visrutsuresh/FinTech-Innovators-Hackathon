'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { authenticateUser } from '@/lib/mock-data'
import { Role } from '@/types'
import Button from '@/components/ui/Button'

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

    await new Promise(r => setTimeout(r, 600)) // simulate network

    const user = authenticateUser(email, password)
    if (!user) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    login(user)
    if (user.role === Role.ADVISER) {
      router.push('/adviser')
    } else {
      router.push(`/client/${user.id}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div
          className="p-8 rounded-2xl"
          style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-center mb-8">
            <div className="text-4xl font-black mb-2" style={{ color: '#C9A227' }}>Huat 🤑</div>
            <h1 className="text-xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-white/50 mt-1">Login to your financial hub</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-widest">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)' }}>
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Login
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl space-y-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs text-white/40 font-medium mb-2">Quick access — demo accounts</p>
            {[
              { email: 'adviser@demo.com', label: 'Adviser — David Koh' },
              { email: 'alex@demo.com', label: 'Client — Alex Chen (Aggressive)' },
              { email: 'sarah@demo.com', label: 'Client — Sarah Lim (Moderate)' },
              { email: 'raymond@demo.com', label: 'Client — Raymond Wong (Conservative)' },
            ].map(d => (
              <button
                key={d.email}
                type="button"
                onClick={() => { setEmail(d.email); setPassword('demo123') }}
                className="block w-full text-left text-xs px-2 py-1.5 rounded-lg hover:text-white transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {d.label}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-white/40 mt-6">
            No account?{' '}
            <Link href="/auth/signup" className="hover:text-white transition-colors" style={{ color: '#C9A227' }}>
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
