'use client'

import { motion } from 'framer-motion'
import ScoreGauge from '@/components/ui/ScoreGauge'
import type { WellnessScore } from '@/types'
import { getScoreColor } from '@/lib/utils'

interface WellnessScorecardProps {
  score: WellnessScore
}

const subScores = [
  { key: 'diversification' as const, label: 'Diversification', weight: '40%' },
  { key: 'liquidity' as const, label: 'Liquidity', weight: '35%' },
  { key: 'behavioral' as const, label: 'Behavioural', weight: '25%' },
]

export default function WellnessScorecard({ score }: WellnessScorecardProps) {
  const overallColor = getScoreColor(score.overall)

  return (
    <div className="space-y-5">
      {/* Main gauge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center pt-2"
      >
        <ScoreGauge score={score.overall} size={190} strokeWidth={14} showScore />
        <div className="text-center mt-3">
          <p className="text-sm font-bold" style={{ color: overallColor }}>
            {score.label}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Overall wellness score</p>
        </div>
      </motion.div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* Sub-score rows */}
      <div className="space-y-3.5">
        {subScores.map((sub, i) => {
          const val = score[sub.key]
          const color = getScoreColor(val)
          return (
            <motion.div
              key={sub.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.09, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{sub.label}</span>
                  <span className="text-[10px] ml-1.5" style={{ color: 'var(--text-caption)' }}>{sub.weight}</span>
                </div>
                <span className="text-xs font-bold tabular-nums" style={{ color }}>
                  {val}<span className="text-[10px] font-normal" style={{ color: 'var(--text-caption)' }}>/100</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.9, delay: 0.35 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Score context removed as per UI feedback */}
    </div>
  )
}
