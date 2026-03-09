'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { Role } from '@/types'
import type { Client, WellnessScore } from '@/types'
import GlassCard from '@/components/ui/GlassCard'
import Badge from '@/components/ui/Badge'
import WealthWallet from '@/components/WealthWallet'
import WellnessScorecard from '@/components/wellness/WellnessScorecard'
import ScoreBreakdown from '@/components/wellness/ScoreBreakdown'
import AIRecommendations from '@/components/AIRecommendations'

interface ClientViewProps {
  client: Client
  wellnessScore: WellnessScore
}

const RISK_VARIANT: Record<string, 'emerald' | 'gold' | 'red'> = {
  conservative: 'emerald',
  moderate: 'gold',
  aggressive: 'red',
}

export default function ClientView({ client, wellnessScore }: ClientViewProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }
    // Client can only view their own page; adviser can view any
    if (user.role === Role.CLIENT && user.id !== client.id) {
      router.replace(`/client/${user.id}`)
    }
  }, [user, isLoading, client.id, router])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/40">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 md:px-8 pt-24 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8 flex-wrap gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: 'rgba(245,200,66,0.15)', color: '#F5C842' }}
            >
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{client.name}</h1>
              <p className="text-sm text-white/50">{client.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={RISK_VARIANT[client.riskProfile] || 'gray'}>
              {client.riskProfile} risk
            </Badge>
            {user.role === Role.ADVISER && (
              <button
                onClick={() => router.push('/adviser')}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Wealth Wallet */}
        <GlassCard className="lg:col-span-1" delay={0.1}>
          <h2 className="text-base font-semibold text-white mb-4">Wealth Wallet</h2>
          <WealthWallet portfolio={client.portfolio} />
        </GlassCard>

        {/* Middle: Wellness Scorecard */}
        <GlassCard className="lg:col-span-1" delay={0.2}>
          <h2 className="text-base font-semibold text-white mb-4">Wellness Scorecard</h2>
          <WellnessScorecard score={wellnessScore} />
        </GlassCard>

        {/* Right: Score Breakdown + AI */}
        <div className="space-y-6">
          <GlassCard delay={0.3}>
            <h2 className="text-base font-semibold text-white mb-4">Score Breakdown</h2>
            <ScoreBreakdown score={wellnessScore} />
          </GlassCard>

          <GlassCard delay={0.4}>
            <AIRecommendations
              clientId={client.id}
              portfolio={client.portfolio}
              wellnessScore={wellnessScore}
              riskProfile={client.riskProfile}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
