'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { RecommendationResponse, Portfolio, WellnessScore, RiskProfile } from '@/types'

interface AIRecommendationsProps {
  clientId: string
  portfolio: Portfolio
  wellnessScore: WellnessScore
  riskProfile: RiskProfile
}

const PRIORITY_VARIANT: Record<string, 'red' | 'gold' | 'gray'> = {
  high: 'red',
  medium: 'gold',
  low: 'gray',
}

const CATEGORY_ICONS: Record<string, string> = {
  diversification: '🎯',
  liquidity: '💧',
  risk: '⚠️',
  opportunity: '🚀',
}

export default function AIRecommendations({
  clientId,
  portfolio,
  wellnessScore,
  riskProfile,
}: AIRecommendationsProps) {
  const [data, setData] = useState<RecommendationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [scenario, setScenario] = useState('')
  const [scenarioLoading, setScenarioLoading] = useState(false)

  const fetchRecommendations = async (scenarioText?: string) => {
    const isScenario = !!scenarioText
    if (isScenario) setScenarioLoading(true)
    else setLoading(true)

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          portfolio,
          wellnessScore,
          riskProfile,
          scenario: scenarioText,
        }),
      })
      const json = await res.json()
      setData(json)
    } catch {
      // keep existing data on error
    } finally {
      if (isScenario) setScenarioLoading(false)
      else setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [clientId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <div>
          <h3 className="text-base font-semibold text-white">AI Recommendations</h3>
          <p className="text-xs text-white/40">Powered by Claude claude-sonnet-4-6</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center py-12 gap-4">
          <LoadingSpinner size={36} />
          <p className="text-sm text-white/50">Analyzing your portfolio...</p>
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <AnimatePresence mode="wait">
          <motion.div
            key={JSON.stringify(data)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Summary */}
            <div
              className="p-4 rounded-xl text-sm text-white/80 leading-relaxed"
              style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.15)' }}
            >
              <p className="text-xs text-gold-400 font-semibold mb-1 uppercase tracking-widest" style={{ color: '#F5C842' }}>
                Summary
              </p>
              {data.summary}
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              {data.recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{CATEGORY_ICONS[rec.category] || '💡'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-medium text-white">{rec.title}</p>
                        <Badge variant={PRIORITY_VARIANT[rec.priority] || 'gray'}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Market Context */}
            {data.marketContext && (
              <div
                className="p-3 rounded-lg text-xs text-white/50 italic"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <span className="not-italic text-white/30 font-medium">Market Context: </span>
                {data.marketContext}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Scenario Input */}
      <div
        className="pt-4 mt-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs text-white/50 mb-2">Ask a scenario question:</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={scenario}
            onChange={e => setScenario(e.target.value)}
            placeholder="e.g. What if I want to retire in 5 years?"
            className="flex-1 text-sm px-3 py-2 rounded-lg outline-none text-white placeholder-white/30"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && scenario.trim()) {
                fetchRecommendations(scenario.trim())
              }
            }}
          />
          <Button
            variant="primary"
            size="sm"
            loading={scenarioLoading}
            disabled={!scenario.trim() || scenarioLoading}
            onClick={() => fetchRecommendations(scenario.trim())}
          >
            Ask
          </Button>
        </div>
      </div>
    </div>
  )
}
