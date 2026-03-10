'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

type BreakdownKey = 'diversification' | 'liquidity' | 'behavioral'

const breakdownItems: Array<{
  key: BreakdownKey
  label: string
  Icon: ({ color }: { color: string }) => JSX.Element
  weight: string
  description: string
}> = [
  {
    key: 'diversification',
    label: 'Diversification',
    Icon: IconDiversification,
    weight: '40%',
    description: 'Spread across asset classes, measured via the Herfindahl-Hirschman Index. Lower concentration = higher score.',
  },
  {
    key: 'liquidity',
    label: 'Liquidity',
    Icon: IconLiquidity,
    weight: '35%',
    description: 'Ratio of assets convertible to cash without major loss — stocks, crypto, bonds and cash all count.',
  },
  {
    key: 'behavioral',
    label: 'Behavioural Alignment',
    Icon: IconBehavioral,
    weight: '25%',
    description: "How well the portfolio's actual volatility profile matches the client's stated risk tolerance.",
  },
]

function BreakdownCardContent({
  item,
  value,
  color,
  compact = false,
}: {
  item: (typeof breakdownItems)[number]
  value: number
  color: string
  compact?: boolean
}) {
  return (
    <>
      <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-4'}`}>
        <div className="flex items-center gap-2.5">
          <div
            className={`rounded-lg flex items-center justify-center ${compact ? 'w-7 h-7' : 'w-10 h-10'}`}
            style={{ background: `${color}14` }}
          >
            <item.Icon color={color} />
          </div>
          <div>
            <p className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'rgba(255,255,255,0.9)' }}>{item.label}</p>
            <p className={compact ? 'text-[10px]' : 'text-xs'} style={{ color: 'var(--text-caption)' }}>Weight: {item.weight}</p>
          </div>
        </div>
        <span className={`font-bold tabular-nums ${compact ? 'text-xl' : 'text-2xl'}`} style={{ color }}>
          {value}
        </span>
      </div>
      <div className={`rounded-full overflow-hidden ${compact ? 'h-1 mb-3' : 'h-2 mb-4'}`} style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}aa, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className={`leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--text-muted)' }}>{item.description}</p>
    </>
  )
}

export default function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const [peekItem, setPeekItem] = useState<(typeof breakdownItems)[number] | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {breakdownItems.map((item, i) => {
          const value = score[item.key]
          const color = getScoreColor(value)
          return (
            <motion.button
              type="button"
              key={item.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.09, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setPeekItem(item)}
              className="rounded-xl p-4 w-full text-left cursor-pointer transition-all hover:border-opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
              }}
            >
              <BreakdownCardContent item={item} value={value} color={color} compact />
            </motion.button>
          )
        })}
      </div>

      {/* Center peek modal */}
      <AnimatePresence>
        {peekItem && (() => {
          const value = score[peekItem.key]
          const color = getScoreColor(value)
          return (
            <>
              <motion.div
                key="score-peek-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50"
                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
                onClick={() => setPeekItem(null)}
                aria-hidden
              />
              <motion.div
                key={`score-peek-${peekItem.key}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="score-peek-title"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
                onClick={e => e.stopPropagation()}
              >
                <div
                  className="rounded-2xl p-6 shadow-2xl"
                  style={{
                    background: '#111111',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                  }}
                >
                  <div className="flex items-center justify-end mb-2">
                    <button
                      type="button"
                      onClick={() => setPeekItem(null)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                      }}
                      aria-label="Close"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div id="score-peek-title" className="sr-only">{peekItem.label}</div>
                  <BreakdownCardContent item={peekItem} value={value} color={color} />
                </div>
              </motion.div>
            </>
          )
        })()}
      </AnimatePresence>
    </>
  )
}
