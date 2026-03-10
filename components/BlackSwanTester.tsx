'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AssetClass, RiskProfile } from '@/types'
import type { Portfolio, WellnessScore } from '@/types'
import { calculateWellnessScore } from '@/lib/wellness'
import { formatCurrency, getScoreColor } from '@/lib/utils'

interface Scenario {
  label: string
  emoji: string
  description: string
  impacts: Partial<Record<AssetClass, number>> // multiplier change, e.g. -0.55 = drop 55%
}

const SCENARIOS: Record<string, Scenario> = {
  crash_2008: {
    label: '2008 Crisis',
    emoji: '🏦',
    description: 'Global financial meltdown — Lehman Brothers collapse',
    impacts: {
      [AssetClass.STOCKS]: -0.55,
      [AssetClass.BONDS]: +0.10,
      [AssetClass.REAL_ESTATE]: -0.30,
      [AssetClass.PRIVATE]: -0.40,
      [AssetClass.CASH]: 0,
      [AssetClass.CRYPTO]: 0,
    },
  },
  covid_2020: {
    label: '2020 COVID',
    emoji: '🦠',
    description: 'Pandemic shock — fastest bear market in history',
    impacts: {
      [AssetClass.STOCKS]: -0.34,
      [AssetClass.CRYPTO]: -0.50,
      [AssetClass.BONDS]: +0.05,
      [AssetClass.REAL_ESTATE]: -0.10,
      [AssetClass.CASH]: 0,
      [AssetClass.PRIVATE]: -0.20,
    },
  },
  crypto_winter: {
    label: 'Crypto Winter',
    emoji: '❄️',
    description: '2022 crypto collapse — Luna, FTX, mass de-leveraging',
    impacts: {
      [AssetClass.CRYPTO]: -0.75,
      [AssetClass.STOCKS]: -0.20,
      [AssetClass.BONDS]: -0.13,
      [AssetClass.REAL_ESTATE]: 0,
      [AssetClass.CASH]: 0,
      [AssetClass.PRIVATE]: -0.30,
    },
  },
  hyperinflation: {
    label: 'Hyperinflation',
    emoji: '📈',
    description: 'Sustained high inflation eroding cash and bonds',
    impacts: {
      [AssetClass.CASH]: -0.40,
      [AssetClass.BONDS]: -0.50,
      [AssetClass.STOCKS]: -0.20,
      [AssetClass.REAL_ESTATE]: +0.20,
      [AssetClass.CRYPTO]: +0.50,
      [AssetClass.PRIVATE]: -0.10,
    },
  },
}

interface Props {
  portfolio: Portfolio
  riskProfile: RiskProfile
  baseScore: WellnessScore
}

export default function BlackSwanTester({ portfolio, riskProfile, baseScore }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const applyScenario = (key: string): { portfolio: Portfolio; score: WellnessScore } => {
    const scenario = SCENARIOS[key]
    const stressed = portfolio.assets.map(asset => {
      const impact = scenario.impacts[asset.assetClass] ?? 0
      return { ...asset, value: Math.max(0, asset.value * (1 + impact)) }
    })
    const totalValue = stressed.reduce((s, a) => s + a.value, 0)
    const stressedPortfolio: Portfolio = { ...portfolio, assets: stressed, totalValue }
    return { portfolio: stressedPortfolio, score: calculateWellnessScore(stressedPortfolio, riskProfile) }
  }

  const result = activeKey ? applyScenario(activeKey) : null
  const valueDelta = result ? result.portfolio.totalValue - portfolio.totalValue : 0
  const scoreDelta = result ? result.score.overall - baseScore.overall : 0

  return (
    <div className="space-y-4">
      {/* Scenario buttons */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(SCENARIOS).map(([key, s]) => (
          <button
            key={key}
            onClick={() => setActiveKey(prev => prev === key ? null : key)}
            className="rounded-xl p-3 text-left transition-all"
            style={{
              background: activeKey === key ? 'rgba(201,162,39,0.10)' : 'rgba(255,255,255,0.03)',
              border: activeKey === key
                ? '1px solid rgba(201,162,39,0.35)'
                : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p className="text-sm mb-0.5">{s.emoji}</p>
            <p className="text-xs font-semibold text-white/80">{s.label}</p>
            <p className="text-[10px] text-white/30 leading-tight mt-0.5 line-clamp-2">{s.description}</p>
          </button>
        ))}
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && activeKey && (
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-xs text-white/35 uppercase tracking-widest">Simulated impact</p>

            {/* Value row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/30 mb-0.5">Portfolio value</p>
                <p className="text-sm font-bold text-white">{formatCurrency(result.portfolio.totalValue)}</p>
              </div>
              <span
                className="text-xs font-semibold px-2 py-1 rounded-lg"
                style={{
                  background: valueDelta < 0 ? 'rgba(239,68,68,0.10)' : 'rgba(16,185,129,0.10)',
                  color: valueDelta < 0 ? '#EF4444' : '#10B981',
                }}
              >
                {valueDelta >= 0 ? '+' : ''}{formatCurrency(valueDelta)}
              </span>
            </div>

            {/* Score row */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/30 mb-0.5">Wellness score</p>
                <p className="text-sm font-bold" style={{ color: getScoreColor(result.score.overall) }}>
                  {result.score.overall} / 100 ({result.score.label})
                </p>
              </div>
              <span
                className="text-xs font-semibold px-2 py-1 rounded-lg"
                style={{
                  background: scoreDelta < 0 ? 'rgba(239,68,68,0.10)' : 'rgba(16,185,129,0.10)',
                  color: scoreDelta < 0 ? '#EF4444' : '#10B981',
                }}
              >
                {scoreDelta >= 0 ? '+' : ''}{scoreDelta} pts
              </span>
            </div>

            {/* Per-asset-class impact summary */}
            <div className="space-y-1 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {Object.entries(SCENARIOS[activeKey].impacts)
                .filter(([, v]) => v !== 0)
                .map(([cls, impact]) => (
                  <div key={cls} className="flex items-center justify-between">
                    <span className="text-[10px] text-white/35 capitalize">{cls.replace('_', ' ')}</span>
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: impact < 0 ? '#EF4444' : '#10B981' }}
                    >
                      {impact >= 0 ? '+' : ''}{(impact * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!activeKey && (
        <p className="text-[10px] text-white/20 text-center pt-1">Select a scenario above to simulate the impact on your portfolio</p>
      )}
    </div>
  )
}
