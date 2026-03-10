'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { AssetClass } from '@/types'
import type { Portfolio } from '@/types'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils'

const TIER: Record<AssetClass, 1 | 2 | 3> = {
  [AssetClass.CASH]: 1,
  [AssetClass.STOCKS]: 2,
  [AssetClass.BONDS]: 2,
  [AssetClass.CRYPTO]: 2,
  [AssetClass.REAL_ESTATE]: 3,
  [AssetClass.PRIVATE]: 3,
}

const TIER_COLOR: [string, string, string] = ['#10B981', '#C9A227', '#EF4444']

interface Props {
  portfolio: Portfolio
}

export default function FlashLiquidityScorecard({ portfolio }: Props) {
  const [amount, setAmount] = useState('')
  const [tested, setTested] = useState(false)

  const tier1 = portfolio.assets.filter(a => TIER[a.assetClass] === 1).reduce((s, a) => s + a.value, 0)
  const tier2 = portfolio.assets.filter(a => TIER[a.assetClass] === 2).reduce((s, a) => s + a.value, 0)
  const tier3 = portfolio.assets.filter(a => TIER[a.assetClass] === 3).reduce((s, a) => s + a.value, 0)
  const liquid = tier1 + tier2

  const target = parseFloat(amount.replace(/,/g, '')) || 0
  const shortfall = Math.max(0, target - liquid)
  const pass = target > 0 && shortfall === 0

  const chartData = [
    { label: 'T+0', value: tier1, color: TIER_COLOR[0] },
    { label: 'T+2', value: tier1 + tier2, color: TIER_COLOR[1] },
    { label: 'T+30', value: tier1 + tier2 + tier3, color: TIER_COLOR[2] },
  ]

  const chips = [
    { label: 'T+0 · 24 hrs', value: tier1, color: TIER_COLOR[0], desc: 'Cash' },
    { label: 'T+2 · 2-3 days', value: liquid, color: TIER_COLOR[1], desc: '+ Stocks, Bonds, Crypto' },
    { label: 'T+30 · All assets', value: tier1 + tier2 + tier3, color: TIER_COLOR[2], desc: '+ Real Estate, Private' },
  ]

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-2">
        {chips.map(item => (
          <div
            key={item.label}
            className="rounded-xl p-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[10px] font-semibold mb-0.5" style={{ color: item.color }}>{item.label}</p>
            <p className="text-sm font-bold text-white">{formatCurrencyCompact(item.value)}</p>
            <p className="text-[9px] text-white/25 leading-tight mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="35%" margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => formatCurrencyCompact(Number(v))}
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10,
                fontSize: 11,
                color: '#fff',
              }}
              formatter={(value) => [formatCurrencyCompact(Number(value)), 'Accessible']}
            />
            <Bar dataKey="value" radius={[5, 5, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* Stress test */}
      <div>
        <p className="text-xs font-medium text-white/60 mb-1">Liquidity stress test</p>
        <p className="text-[11px] text-white/30 mb-3">How much cash do you need within 7 days?</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">$</span>
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setTested(false) }}
              placeholder="e.g. 50000"
              min="0"
              className="w-full pl-7 pr-3 py-2 text-xs rounded-xl outline-none text-white placeholder-white/20"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
          <button
            onClick={() => { if (target > 0) setTested(true) }}
            disabled={!target}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
            style={{ background: '#C9A227', color: '#080808' }}
          >
            Test
          </button>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {tested && target > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-3.5"
            style={{
              background: pass ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${pass ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold" style={{ color: pass ? '#10B981' : '#EF4444' }}>
                {pass ? 'Portfolio can withstand this stress' : 'Liquidity shortfall detected'}
              </p>
              {pass ? (
                <p className="text-xs text-white/45">
                  <span className="text-white/70 font-medium">{formatCurrency(liquid)}</span> accessible within T+2 — {formatCurrency(liquid - target)} above your target.
                </p>
              ) : (
                <p className="text-xs text-white/45">
                  Despite a net worth of <span className="text-white/70 font-medium">{formatCurrency(portfolio.totalValue)}</span>, only <span className="text-white/70 font-medium">{formatCurrency(liquid)}</span> is accessible within T+2. You face a <span style={{ color: '#EF4444' }} className="font-semibold">{formatCurrency(shortfall)} shortfall</span>.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
