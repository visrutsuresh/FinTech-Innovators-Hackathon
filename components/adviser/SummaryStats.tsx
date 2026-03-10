'use client'

import { motion } from 'framer-motion'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import type { Client } from '@/types'
import { calculateWellnessScore } from '@/lib/wellness'
import { getScoreColor } from '@/lib/utils'

interface SummaryStatsProps {
  clients: Client[]
}

function IconAUM() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.75 15v-2.5h-1.5V17h-2v-1.5h.75v-5H9V9h5v1.5h-.75v5h.75V17h-2z" />
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <path d="M8 12h2m4 0h2" strokeWidth="1.5" />
    </svg>
  )
}
function IconWellness() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
function IconClients() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconAlert() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

export default function SummaryStats({ clients }: SummaryStatsProps) {
  const visibleClients = clients.filter(c => !c.hideAmountsFromAdviser)
  const totalAUM = visibleClients.reduce((s, c) => s + c.portfolio.totalValue, 0)
  const wellnessScores = clients.map(c => calculateWellnessScore(c.portfolio, c.riskProfile))
  const avgWellness = clients.length > 0
    ? Math.round(wellnessScores.reduce((s, w) => s + w.overall, 0) / clients.length)
    : 0
  const alertCount = wellnessScores.filter(w => w.overall < 50).length
  const privateCount = clients.filter(c => c.hideAmountsFromAdviser).length

  const stats = [
    {
      label: 'Total AUM',
      sub: privateCount > 0 ? `${visibleClients.length} clients (${privateCount} private)` : 'across all clients',
      node: (
        <span className="text-2xl font-bold text-white tabular-nums">
          $<AnimatedCounter
            value={totalAUM >= 1_000_000 ? totalAUM / 1_000_000 : totalAUM / 1_000}
            decimals={totalAUM >= 1_000_000 ? 2 : 0}
          />
          {totalAUM >= 1_000_000 ? 'M' : 'K'}
        </span>
      ),
      icon: <IconAUM />,
      iconBg: 'rgba(201,162,39,0.12)',
      iconColor: '#C9A227',
      borderColor: 'rgba(201,162,39,0.15)',
    },
    {
      label: 'Avg Wellness',
      sub: 'portfolio average',
      node: (
        <span className="text-2xl font-bold tabular-nums" style={{ color: getScoreColor(avgWellness) }}>
          <AnimatedCounter value={avgWellness} />
          <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-caption)' }}>/ 100</span>
        </span>
      ),
      icon: <IconWellness />,
      iconBg: 'rgba(16,185,129,0.12)',
      iconColor: '#10B981',
      borderColor: 'rgba(16,185,129,0.15)',
    },
    {
      label: 'Clients',
      sub: 'under management',
      node: (
        <span className="text-2xl font-bold text-white tabular-nums">
          <AnimatedCounter value={clients.length} />
        </span>
      ),
      icon: <IconClients />,
      iconBg: 'rgba(99,102,241,0.12)',
      iconColor: '#457B9D',
      borderColor: 'rgba(99,102,241,0.15)',
    },
    {
      label: 'Alerts',
      sub: alertCount > 0 ? 'need attention' : 'all healthy',
      node: (
        <span className="text-2xl font-bold tabular-nums" style={{ color: alertCount > 0 ? '#EF4444' : '#10B981' }}>
          <AnimatedCounter value={alertCount} />
        </span>
      ),
      icon: <IconAlert />,
      iconBg: alertCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
      iconColor: alertCount > 0 ? '#EF4444' : '#10B981',
      borderColor: alertCount > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="p-5 rounded-2xl group"
          style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.06)',
            transition: 'border-color 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = stat.borderColor)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
            style={{ background: stat.iconBg, color: stat.iconColor }}
          >
            {stat.icon}
          </div>
          <div className="mb-1">{stat.node}</div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-caption)' }}>{stat.label}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-caption)' }}>{stat.sub}</p>
        </motion.div>
      ))}
    </div>
  )
}
