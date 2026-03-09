'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { Role } from '@/types'
import type { Client, WellnessScore } from '@/types'
import WealthWallet from '@/components/WealthWallet'
import WellnessScorecard from '@/components/wellness/WellnessScorecard'
import ScoreBreakdown from '@/components/wellness/ScoreBreakdown'
import AIRecommendations from '@/components/AIRecommendations'

interface ClientViewProps {
  client: Client
  wellnessScore: WellnessScore
}

const RISK_COLOR: Record<string, string> = {
  conservative: '#10B981',
  moderate: '#C9A227',
  aggressive: '#EF4444',
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
      {children}
    </p>
  )
}

export default function ClientView({ client, wellnessScore }: ClientViewProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) { router.replace('/auth/login'); return }
    if (user.role === Role.CLIENT && user.id !== client.id) {
      router.replace(`/client/${user.id}`)
    }
  }, [user, isLoading, client.id, router])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#080808' }}>
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{ borderColor: '#C9A227', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  const riskColor = RISK_COLOR[client.riskProfile] ?? '#C9A227'

  return (
    <div className="min-h-screen px-5 md:px-8 pt-20 pb-16" style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto">

        {/* ── Page header ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between pt-4 mb-7 flex-wrap gap-3"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'rgba(201,162,39,0.12)', color: '#C9A227' }}
            >
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{client.name}</h1>
              <p className="text-xs text-white/35">{client.email}</p>
            </div>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full ml-1"
              style={{
                background: `${riskColor}12`,
                color: riskColor,
                border: `1px solid ${riskColor}25`,
              }}
            >
              {client.riskProfile} risk
            </span>
          </div>

          {user.role === Role.ADVISER && (
            <button
              onClick={() => router.push('/adviser')}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to dashboard
            </button>
          )}
        </motion.div>

        {/* ── Row 1: Portfolio value + Wellness score ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          {/* Portfolio — wider */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-3"
          >
            <Card className="p-6 h-full">
              <SectionTitle>Wealth Wallet</SectionTitle>
              <WealthWallet portfolio={client.portfolio} />
            </Card>
          </motion.div>

          {/* Wellness score — narrower */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 h-full">
              <SectionTitle>Wellness Score</SectionTitle>
              <WellnessScorecard score={wellnessScore} />
            </Card>
          </motion.div>
        </div>

        {/* ── Row 2: Score breakdown + AI ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="p-6 h-full">
              <SectionTitle>Score Breakdown</SectionTitle>
              <ScoreBreakdown score={wellnessScore} />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 h-full">
              <AIRecommendations
                clientId={client.id}
                portfolio={client.portfolio}
                wellnessScore={wellnessScore}
                riskProfile={client.riskProfile}
              />
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
