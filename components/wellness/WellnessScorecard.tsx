'use client'

import { motion } from 'framer-motion'
import ScoreGauge from '@/components/ui/ScoreGauge'
import WellnessRadar from '@/components/charts/WellnessRadar'
import type { WellnessScore } from '@/types'
import { getScoreColor } from '@/lib/utils'

interface WellnessScorecardProps {
  score: WellnessScore
}

const subScores = [
  { key: 'diversification' as const, label: 'Diversification', description: 'Asset class spread' },
  { key: 'liquidity' as const, label: 'Liquidity', description: 'Access to funds' },
  { key: 'behavioral' as const, label: 'Behavioral Fit', description: 'Risk alignment' },
]

export default function WellnessScorecard({ score }: WellnessScorecardProps) {
  return (
    <div className="space-y-6">
      {/* Main Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center"
      >
        <ScoreGauge score={score.overall} size={200} strokeWidth={16} label={score.label} />
        <div className="mt-3 text-center">
          <p className="text-lg font-semibold" style={{ color: getScoreColor(score.overall) }}>
            {score.label}
          </p>
          <p className="text-sm text-white/50 mt-1">Overall Wellness Score</p>
        </div>
      </motion.div>

      {/* Sub Scores */}
      <div className="grid grid-cols-3 gap-3">
        {subScores.map((sub, i) => (
          <motion.div
            key={sub.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="text-center p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <ScoreGauge score={score[sub.key]} size={80} strokeWidth={8} showScore={true} />
            <p className="text-xs font-medium text-white/80 mt-2">{sub.label}</p>
            <p className="text-xs text-white/40">{sub.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Radar */}
      <div>
        <p className="text-xs text-white/50 mb-2 uppercase tracking-widest">Score Breakdown</p>
        <WellnessRadar score={score} />
      </div>
    </div>
  )
}
