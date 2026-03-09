'use client'

import { motion } from 'framer-motion'
import ScoreGauge from '@/components/ui/ScoreGauge'
import WellnessRadar from '@/components/charts/WellnessRadar'
import type { WellnessScore } from '@/types'
import { getScoreColor, getScoreLabel } from '@/lib/utils'

interface WellnessScorecardProps {
  score: WellnessScore
}

const subScores = [
  { key: 'diversification' as const, label: 'Diversification', abbr: 'DIV' },
  { key: 'liquidity' as const, label: 'Liquidity', abbr: 'LIQ' },
  { key: 'behavioral' as const, label: 'Behavioural', abbr: 'BEH' },
]

export default function WellnessScorecard({ score }: WellnessScorecardProps) {
  const overallColor = getScoreColor(score.overall)

  return (
    <div className="space-y-5">
      {/* Main gauge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center pt-2"
      >
        <ScoreGauge score={score.overall} size={180} strokeWidth={14} showScore label={score.label} />
        <div className="text-center mt-2">
          <p className="text-base font-bold" style={{ color: overallColor }}>
            {score.label}
          </p>
          <p className="text-xs text-white/35 mt-0.5">Overall wellness score</p>
        </div>
      </motion.div>

      {/* Radar chart */}
      <WellnessRadar score={score} />

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* Sub-score rows */}
      <div className="space-y-3">
        {subScores.map((sub, i) => {
          const val = score[sub.key]
          const color = getScoreColor(val)
          return (
            <motion.div
              key={sub.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/55">{sub.label}</span>
                <span className="text-xs font-semibold tabular-nums" style={{ color }}>
                  {val}<span className="text-white/25 font-normal">/100</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Score context pill */}
      <div
        className="rounded-xl p-3 text-xs text-white/40 leading-relaxed"
        style={{ background: `${overallColor}08`, border: `1px solid ${overallColor}18` }}
      >
        Score is weighted: 40% diversification · 35% liquidity · 25% behavioural alignment
      </div>
    </div>
  )
}
