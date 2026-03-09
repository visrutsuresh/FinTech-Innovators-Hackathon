'use client'

import { motion } from 'framer-motion'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import type { Client } from '@/types'
import { calculateWellnessScore } from '@/lib/wellness'
import { getScoreColor } from '@/lib/utils'

interface SummaryStatsProps {
  clients: Client[]
}

// Inline SVG icons — no emojis
function IconAUM() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12h2m6 0h2M12 7v2m0 6v2" />
    </svg>
  )
}
function IconWellness() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
function IconClients() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconAlert() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

export default function SummaryStats({ clients }: SummaryStatsProps) {
  const totalAUM = clients.reduce((s, c) => s + c.portfolio.totalValue, 0)
  const wellnessScores = clients.map(c => calculateWellnessScore(c.portfolio, c.riskProfile))
  const avgWellness = Math.round(wellnessScores.reduce((s, w) => s + w.overall, 0) / clients.length)
  const alertCount = wellnessScores.filter(w => w.overall < 50).length

  const stats = [
    {
      label: 'Total AUM',
      node: (
        <span className="text-2xl font-bold text-white">
          $<AnimatedCounter
            value={totalAUM >= 1_000_000 ? totalAUM / 1_000_000 : totalAUM / 1_000}
            decimals={totalAUM >= 1_000_000 ? 2 : 0}
          />
          {totalAUM >= 1_000_000 ? 'M' : 'K'}
        </span>
      ),
      icon: <IconAUM />,
      iconColor: '#C9A227',
      sub: 'across all clients',
    },
    {
      label: 'Avg Wellness',
      node: (
        <span className="text-2xl font-bold" style={{ color: getScoreColor(avgWellness) }}>
          <AnimatedCounter value={avgWellness} />
          <span className="text-sm text-white/30 font-normal ml-1">/ 100</span>
        </span>
      ),
      icon: <IconWellness />,
      iconColor: '#10B981',
      sub: 'portfolio average',
    },
    {
      label: 'Clients',
      node: (
        <span className="text-2xl font-bold text-white">
          <AnimatedCounter value={clients.length} />
        </span>
      ),
      icon: <IconClients />,
      iconColor: '#6366F1',
      sub: 'under management',
    },
    {
      label: 'Alerts',
      node: (
        <span className="text-2xl font-bold" style={{ color: alertCount > 0 ? '#EF4444' : '#10B981' }}>
          <AnimatedCounter value={alertCount} />
        </span>
      ),
      icon: <IconAlert />,
      iconColor: alertCount > 0 ? '#EF4444' : '#10B981',
      sub: alertCount > 0 ? 'need attention' : 'all healthy',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="p-5 rounded-xl"
          style={{
            background: '#0E0E0E',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
            style={{ background: `${stat.iconColor}15`, color: stat.iconColor }}
          >
            {stat.icon}
          </div>
          <div className="mb-1">{stat.node}</div>
          <p className="text-xs text-white/30">{stat.label}</p>
          <p className="text-xs text-white/20 mt-0.5">{stat.sub}</p>
        </motion.div>
      ))}
    </div>
  )
}
