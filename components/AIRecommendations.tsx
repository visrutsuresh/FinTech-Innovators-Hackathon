'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RecommendationResponse, Portfolio, WellnessScore, RiskProfile } from '@/types'

interface AIRecommendationsProps {
  clientId: string
  portfolio: Portfolio
  wellnessScore: WellnessScore
  riskProfile: RiskProfile
}

const PRIORITY_COLOR: Record<string, string> = {
  high: '#EF4444',
  medium: '#C9A227',
  low: '#6B7280',
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  diversification: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
    </svg>
  ),
  liquidity: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3" />
    </svg>
  ),
  risk: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  opportunity: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
}

export default function AIRecommendations({
  clientId, portfolio, wellnessScore, riskProfile,
}: AIRecommendationsProps) {
  const [data, setData] = useState<RecommendationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [scenario, setScenario] = useState('')
  const [scenarioLoading, setScenarioLoading] = useState(false)

  const fetch_ = async (scenarioText?: string) => {
    const isScenario = !!scenarioText
    isScenario ? setScenarioLoading(true) : setLoading(true)
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, portfolio, wellnessScore, riskProfile, scenario: scenarioText }),
      })
      setData(await res.json())
    } catch { /* keep existing */ }
    finally { isScenario ? setScenarioLoading(false) : setLoading(false) }
  }

  useEffect(() => { fetch_() }, [clientId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(201,162,39,0.12)' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#C9A227" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">AI Recommendations</p>
          <p className="text-xs text-white/30">Powered by Claude Sonnet</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 flex-1">
          <div
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: '#C9A227', borderTopColor: 'transparent' }}
          />
          <p className="text-xs text-white/35">Analysing portfolio…</p>
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <AnimatePresence mode="wait">
          <motion.div
            key={data.summary}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3 flex-1"
          >
            {/* Summary banner */}
            <div
              className="rounded-xl px-4 py-3 text-xs text-white/65 leading-relaxed"
              style={{ background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.12)' }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 block mb-1">
                Summary
              </span>
              {data.summary}
            </div>

            {/* Recommendation cards */}
            {data.recommendations.map((rec, i) => {
              const pColor = PRIORITY_COLOR[rec.priority] ?? '#6B7280'
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-xl p-3.5"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${pColor}15`, color: pColor }}
                    >
                      {CATEGORY_ICON[rec.category] ?? CATEGORY_ICON.risk}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-white/85">{rec.title}</p>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: `${pColor}15`, color: pColor }}
                        >
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-xs text-white/45 leading-relaxed mt-1">{rec.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* Market context */}
            {data.marketContext && (
              <p className="text-xs text-white/25 italic px-1 leading-relaxed">
                {data.marketContext}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Scenario input */}
      <div
        className="pt-3 mt-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <p className="text-xs text-white/30 mb-2">Ask a scenario</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={scenario}
            onChange={e => setScenario(e.target.value)}
            placeholder="e.g. What if I retire in 5 years?"
            className="flex-1 text-xs px-3 py-2 rounded-lg outline-none text-white placeholder-white/20"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && scenario.trim()) fetch_(scenario.trim())
            }}
          />
          <button
            disabled={!scenario.trim() || scenarioLoading}
            onClick={() => fetch_(scenario.trim())}
            className="text-xs font-semibold px-3 py-2 rounded-lg transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: '#C9A227', color: '#080808' }}
          >
            {scenarioLoading ? '…' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  )
}
