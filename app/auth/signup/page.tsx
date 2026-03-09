'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { Role, RiskProfile, AssetClass } from '@/types'
import { mockClients } from '@/lib/mock-data'
import type { Client, Adviser } from '@/types'
import Button from '@/components/ui/Button'

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

    await new Promise(r => setTimeout(r, 600))

    if (role === Role.ADVISER) {
      const newAdviser: Adviser = {
        id: `adviser-${Date.now()}`,
        name,
        email,
        password,
        role: Role.ADVISER,
        clientIds: mockClients.map(c => c.id),
      }
      login(newAdviser)
      router.push('/adviser')
    } else {
      const newClient: Client = {
        id: `client-new-${Date.now()}`,
        name,
        email,
        password,
        role: Role.CLIENT,
        riskProfile: RiskProfile.MODERATE,
        portfolio: {
          assets: [
            { id: 'new-1', name: 'Cash', assetClass: AssetClass.CASH, value: 10000, currency: 'USD' },
          ],
          totalValue: 10000,
          lastUpdated: new Date().toISOString(),
        },
      }
      login(newClient)
      router.push(`/client/${newClient.id}`)
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
            <h1 className="text-xl font-bold text-white">Create Account</h1>
            <p className="text-sm text-white/50 mt-1">Start your wellness journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-widest">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
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

            {/* Role Selection */}
            <div>
              <label className="block text-xs text-white/50 mb-2 uppercase tracking-widest">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {[Role.CLIENT, Role.ADVISER].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="p-4 rounded-xl text-center transition-all"
                    style={{
                      background: role === r ? 'rgba(245,200,66,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${role === r ? 'rgba(245,200,66,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: role === r ? '#C9A227' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <div className="text-2xl mb-1">{r === Role.CLIENT ? '👤' : '👨‍💼'}</div>
                    <div className="text-sm font-medium capitalize">{r}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="hover:text-white transition-colors" style={{ color: '#C9A227' }}>
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
