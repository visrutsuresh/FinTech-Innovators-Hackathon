'use client'

import { motion } from 'framer-motion'
import type { WellnessScore } from '@/types'
import { getScoreColor } from '@/lib/utils'

interface ScoreBreakdownProps {
  score: WellnessScore
}

// SVG icons replacing emojis
function IconDiversification({ color }: { color: string }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
    </svg>
  )
}
function IconLiquidity({ color }: { color: string }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function IconBehavioral({ color }: { color: string }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

const breakdownItems = [
  {
    key: 'diversification' as const,
    label: 'Diversification',
    Icon: IconDiversification,
    weight: '40%',
    description: 'Spread across asset classes, measured via the Herfindahl-Hirschman Index. Lower concentration = higher score.',
  },
  {
    key: 'liquidity' as const,
    label: 'Liquidity',
    Icon: IconLiquidity,
    weight: '35%',
    description: 'Ratio of assets convertible to cash without major loss — stocks, crypto, bonds and cash all count.',
  },
  {
    key: 'behavioral' as const,
    label: 'Behavioural Alignment',
    Icon: IconBehavioral,
    weight: '25%',
    description: 'How well the portfolio\'s actual volatility profile matches the client\'s stated risk tolerance.',
  },
]

export default function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  return (
    <div className="space-y-3">
      {breakdownItems.map((item, i) => {
        const value = score[item.key]
        const color = getScoreColor(value)
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.09 }}
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}15` }}
                >
                  <item.Icon color={color} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/80">{item.label}</p>
                  <p className="text-xs text-white/25">Weight: {item.weight}</p>
                </div>
              </div>
              <span className="text-xl font-bold tabular-nums" style={{ color }}>
                {value}
              </span>
            </div>

            {/* Bar */}
            <div className="h-1 rounded-full mb-2.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.09, ease: 'easeOut' }}
              />
            </div>

            {/* Description */}
            <p className="text-xs text-white/35 leading-relaxed">{item.description}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
