'use client'

import { motion } from 'framer-motion'
import type { WellnessScore } from '@/types'
import { getScoreColor } from '@/lib/utils'

interface ScoreBreakdownProps {
  score: WellnessScore
}

const breakdownItems = [
  {
    key: 'diversification' as const,
    label: 'Diversification',
    icon: '🎯',
    weight: '40%',
    description: 'Measures how well assets are spread across different asset classes using the Herfindahl-Hirschman Index.',
  },
  {
    key: 'liquidity' as const,
    label: 'Liquidity',
    icon: '💧',
    weight: '35%',
    description: 'Evaluates what portion of your portfolio can be converted to cash quickly without significant loss.',
  },
  {
    key: 'behavioral' as const,
    label: 'Behavioral Alignment',
    icon: '🧠',
    weight: '25%',
    description: 'Assesses whether your portfolio composition aligns with your stated risk profile and investment goals.',
  },
]

export default function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  return (
    <div className="space-y-4">
      {breakdownItems.map((item, i) => {
        const value = score[item.key]
        const color = getScoreColor(value)
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-white/40">Weight: {item.weight}</p>
                </div>
              </div>
              <span className="text-xl font-bold" style={{ color }}>{value}</span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-white/40 mt-2">{item.description}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
