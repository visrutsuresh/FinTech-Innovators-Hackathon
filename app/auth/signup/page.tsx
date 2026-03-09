'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { Role, RiskProfile, AssetClass } from '@/types'
import { mockClients } from '@/lib/mock-data'
import type { Client, Adviser } from '@/types'

const GOLD = '#C9A227'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>(Role.CLIENT)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))

    if (role === Role.ADVISER) {
      const newAdviser: Adviser = {
        id: `adviser-${Date.now()}`,
        name, email, password,
        role: Role.ADVISER,
        clientIds: mockClients.map(c => c.id),
      }
      login(newAdviser)
      router.push('/adviser')
    } else {
      const newClient: Client = {
        id: `client-new-${Date.now()}`,
        name, email, password,
        role: Role.CLIENT,
        riskProfile: RiskProfile.MODERATE,
        portfolio: {
          assets: [{ id: 'new-1', name: 'Cash', assetClass: AssetClass.CASH, value: 10000, currency: 'USD' }],
          totalValue: 10000,
          lastUpdated: new Date().toISOString(),
        },
      }
      login(newClient)
      router.push(`/client/${newClient.id}`)
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
        transition={{ duration: 0.45 }}
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Create account</h1>
          <p className="text-sm text-white/40 mt-1">Start your wellness journey</p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Role picker */}
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
              {loading ? 'Creating account…' : 'Create account'}
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
    </div>
  )
}
