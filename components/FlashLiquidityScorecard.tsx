'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { AssetClass } from '@/types'
import type { Portfolio } from '@/types'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils'
import { GlowingEffect } from '@/components/ui/glowing-effect'

const TIER: Record<AssetClass, 1 | 2 | 3> = {
  [AssetClass.CASH]: 1,
  [AssetClass.STOCKS]: 2,
  [AssetClass.BONDS]: 2,
  [AssetClass.CRYPTO]: 3,
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
  const [focused, setFocused] = useState(false)

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

  const tierCards = [
    {
      label: 'T+0',
      sublabel: '24 hours',
      value: tier1,
      color: TIER_COLOR[0],
      desc: 'Cash only',
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'T+2',
      sublabel: '2–3 days',
      value: liquid,
      color: TIER_COLOR[1],
      desc: '+ Stocks, Bonds',
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
    },
    {
      label: 'T+30',
      sublabel: 'All assets',
      value: tier1 + tier2 + tier3,
      color: TIER_COLOR[2],
      desc: '+ Crypto, Real Estate, Private',
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Tier cards */}
      <div className="grid grid-cols-3 gap-2">
        {tierCards.map(item => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
              style={{ background: `${item.color}14`, color: item.color }}
            >
              {item.icon}
            </div>
            <p className="text-[10px] font-bold mb-0.5" style={{ color: item.color }}>{item.label}</p>
            <p className="text-xs font-bold text-white tabular-nums">{formatCurrencyCompact(item.value)}</p>
            <p className="text-[9px] mt-1 leading-tight" style={{ color: 'rgba(255,255,255,0.25)' }}>{item.sublabel}</p>
            <p className="text-[9px] leading-tight" style={{ color: 'rgba(255,255,255,0.2)' }}>{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="35%" margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => formatCurrencyCompact(Number(v))}
              tick={{ fill: 'rgba(255,255,255,0.22)', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{
                background: '#141414',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10,
                fontSize: 11,
                color: '#fff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
              formatter={(value) => [formatCurrencyCompact(Number(value)), 'Accessible']}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* Stress test */}
      <div>
        <p className="text-xs font-semibold text-white/60 mb-1">Liquidity stress test</p>
        <p className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.28)' }}>
          How much cash do you need within 7 days?
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>$</span>
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setTested(false) }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="e.g. 50000"
              min="0"
              className="w-full pl-7 pr-3 py-2.5 text-xs rounded-xl outline-none text-white placeholder-white/20 transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: focused ? '1px solid rgba(201,162,39,0.4)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: focused ? '0 0 0 3px rgba(201,162,39,0.08)' : 'none',
              }}
            />
          </div>
          <div className="relative rounded-xl">
            <GlowingEffect spread={25} glow={false} disabled={false} proximity={50} inactiveZone={0.01} borderWidth={2} />
            <button
              onClick={() => { if (target > 0) setTested(true) }}
              disabled={!target}
              className="relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
              style={{ background: '#DFD0B8', color: '#080808' }}
            >
              Test
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {tested && target > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="rounded-xl p-3.5"
            style={{
              background: pass ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${pass ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'}`,
            }}
          >
            <div className="flex items-start gap-2.5">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: pass ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}
              >
                {pass ? (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: pass ? '#10B981' : '#EF4444' }}>
                  {pass ? 'Portfolio can withstand this stress' : 'Liquidity shortfall detected'}
                </p>
                {pass ? (
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <span className="font-semibold text-white/70">{formatCurrency(liquid)}</span> accessible within T+2 — {formatCurrency(liquid - target)} above your target.
                  </p>
                ) : (
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Only <span className="font-semibold text-white/70">{formatCurrency(liquid)}</span> accessible within T+2. You face a{' '}
                    <span style={{ color: '#EF4444' }} className="font-bold">{formatCurrency(shortfall)} shortfall</span>.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
