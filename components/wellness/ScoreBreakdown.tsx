'use client'

import { motion } from 'framer-motion'
import type { WellnessScore } from '@/types'
import { getScoreColor } from '@/lib/utils'

interface ScoreBreakdownProps {
  score: WellnessScore
}

function IconDiversification({ color }: { color: string }) {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h8m-8 6h16" />
    </svg>
  )
}
function IconLiquidity({ color }: { color: string }) {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}
function IconBehavioral({ color }: { color: string }) {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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
    description: "How well the portfolio's actual volatility profile matches the client's stated risk tolerance.",
  },
]

export default function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {breakdownItems.map((item, i) => {
        const value = score[item.key]
        const color = getScoreColor(value)
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.09, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}14` }}
                >
                  <item.Icon color={color} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.label}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>Weight: {item.weight}</p>
                </div>
              </div>
              <span className="text-xl font-bold tabular-nums" style={{ color }}>
                {value}
              </span>
            </div>

            {/* Bar */}
            <div className="h-1 rounded-full mb-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}aa, ${color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.9, delay: 0.25 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.32)' }}>{item.description}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
