'use client'

import { motion } from 'framer-motion'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import type { Client } from '@/types'
import { calculateWellnessScore } from '@/lib/wellness'

interface SummaryStatsProps {
  clients: Client[]
}

export default function SummaryStats({ clients }: SummaryStatsProps) {
  const totalAUM = clients.reduce((s, c) => s + c.portfolio.totalValue, 0)
  const wellnessScores = clients.map(c => calculateWellnessScore(c.portfolio, c.riskProfile))
  const avgWellness = Math.round(wellnessScores.reduce((s, w) => s + w.overall, 0) / clients.length)
  const alertCount = wellnessScores.filter(w => w.overall < 50).length

  const stats = [
    {
      label: 'Total AUM',
      value: totalAUM,
      prefix: '$',
      format: 'compact' as const,
      color: '#F5C842',
      icon: '💰',
    },
    {
      label: 'Avg Wellness',
      value: avgWellness,
      suffix: '/100',
      color: '#10B981',
      icon: '📊',
    },
    {
      label: 'Clients',
      value: clients.length,
      color: '#3B82F6',
      icon: '👥',
    },
    {
      label: 'Alerts',
      value: alertCount,
      color: alertCount > 0 ? '#EF4444' : '#10B981',
      icon: '⚠️',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="p-5 rounded-2xl"
          style={{
            background: 'rgba(26,26,46,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: stat.color }}>
            {stat.prefix}
            {stat.format === 'compact' ? (
              stat.value >= 1_000_000 ? (
                <><AnimatedCounter value={stat.value / 1_000_000} decimals={1} />M</>
              ) : (
                <><AnimatedCounter value={stat.value / 1_000} decimals={0} />K</>
              )
            ) : (
              <AnimatedCounter value={stat.value} />
            )}
            {stat.suffix}
          </div>
          <p className="text-xs text-white/40 mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  )
}
