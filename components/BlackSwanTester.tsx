'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AssetClass, RiskProfile } from '@/types'
import type { Portfolio, WellnessScore } from '@/types'
import { calculateWellnessScore } from '@/lib/wellness'
import { formatCurrency, getScoreColor } from '@/lib/utils'
import { GlowingEffect } from '@/components/ui/glowing-effect'

interface Scenario {
  label: string
  icon: string
  description: string
  impacts: Partial<Record<AssetClass, number>>
  severity: 'extreme' | 'high' | 'moderate'
}

const SCENARIOS: Record<string, Scenario> = {
  crash_2008: {
    label: '2008 Crisis',
    icon: '🏦',
    description: 'Global financial meltdown — Lehman Brothers collapse',
    severity: 'extreme',
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
    icon: '🦠',
    description: 'Pandemic shock — fastest bear market in history',
    severity: 'high',
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
    icon: '❄️',
    description: '2022 crypto collapse — Luna, FTX, mass de-leveraging',
    severity: 'extreme',
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
    icon: '📈',
    description: 'Sustained high inflation eroding cash and bonds',
    severity: 'moderate',
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

const SEVERITY_COLOR = {
  extreme: '#EF4444',
  high: '#F97316',
  moderate: '#C9A227',
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
      {/* Scenario grid */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(SCENARIOS).map(([key, s]) => {
          const active = activeKey === key
          const sColor = SEVERITY_COLOR[s.severity]
          return (
            <motion.button
              key={key}
              onClick={() => setActiveKey(prev => prev === key ? null : key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative rounded-xl p-3.5 text-left transition-all"
              style={{
                background: active ? `${sColor}10` : 'rgba(255,255,255,0.03)',
                border: active ? `1px solid ${sColor}35` : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <GlowingEffect spread={30} glow={false} disabled={false} proximity={60} inactiveZone={0.05} borderWidth={2} />
              <div className="flex items-start justify-between mb-2">
                <span className="text-base">{s.icon}</span>
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: `${sColor}15`, color: sColor }}
                >
                  {s.severity}
                </span>
              </div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{s.label}</p>
              <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.description}</p>
            </motion.button>
          )
        })}
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && activeKey && (
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Simulated Impact · {SCENARIOS[activeKey].label}
              </p>
            </div>

            <div className="p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.015)' }}>
              {/* Value + Score rows */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Portfolio value</p>
                  <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(result.portfolio.totalValue)}</p>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: valueDelta < 0 ? '#EF4444' : '#10B981' }}
                  >
                    {valueDelta >= 0 ? '+' : ''}{formatCurrency(valueDelta)}
                  </span>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Wellness score</p>
                  <p className="text-sm font-bold tabular-nums" style={{ color: getScoreColor(result.score.overall) }}>
                    {result.score.overall}
                    <span className="text-[10px] font-normal ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>/100</span>
                  </p>
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: scoreDelta < 0 ? '#EF4444' : '#10B981' }}
                  >
                    {scoreDelta >= 0 ? '+' : ''}{scoreDelta} pts
                  </span>
                </div>
              </div>

              {/* Per-class impacts */}
              <div className="space-y-1.5 pt-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider pt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Asset class impacts
                </p>
                {Object.entries(SCENARIOS[activeKey].impacts)
                  .filter(([, v]) => v !== 0)
                  .sort(([, a], [, b]) => a - b)
                  .map(([cls, impact]) => (
                    <div key={cls} className="flex items-center gap-2">
                      <span className="text-[10px] capitalize flex-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {cls.replace('_', ' ')}
                      </span>
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', maxWidth: 80 }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: impact < 0 ? '#EF4444' : '#10B981' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.abs(impact) * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-semibold tabular-nums w-10 text-right"
                        style={{ color: impact < 0 ? '#EF4444' : '#10B981' }}
                      >
                        {impact >= 0 ? '+' : ''}{(impact * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!activeKey && (
        <p className="text-[10px] text-center pt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Select a scenario above to simulate the impact on your portfolio
        </p>
      )}
    </div>
  )
}
