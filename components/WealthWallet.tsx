'use client'

import { motion } from 'framer-motion'
import AssetDonut from '@/components/charts/AssetDonut'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import type { Portfolio } from '@/types'
import { formatCurrency } from '@/lib/utils'

const CLASS_COLORS: Record<string, string> = {
  stocks: '#6366F1',
  crypto: '#C9A227',
  cash: '#10B981',
  bonds: '#8B5CF6',
  real_estate: '#F97316',
  private: '#EC4899',
}

const CLASS_LABELS: Record<string, string> = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  cash: 'Cash',
  bonds: 'Bonds',
  real_estate: 'Real Estate',
  private: 'Private',
}

interface WealthWalletProps {
  portfolio: Portfolio
}

export default function WealthWallet({ portfolio }: WealthWalletProps) {
  const classMap: Record<string, number> = {}
  for (const asset of portfolio.assets) {
    classMap[asset.assetClass] = (classMap[asset.assetClass] || 0) + asset.value
  }

  const sorted = Object.entries(classMap).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-5">
      {/* Net worth */}
      <div>
        <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Total value</p>
        <div className="text-3xl font-bold" style={{ color: '#C9A227', letterSpacing: '-0.02em' }}>
          $<AnimatedCounter value={portfolio.totalValue} duration={1200} />
        </div>
        <p className="text-xs text-white/25 mt-1">
          Updated {new Date(portfolio.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Donut + allocation side by side */}
      <div className="flex items-center gap-4">
        <div style={{ width: 160, flexShrink: 0 }}>
          <AssetDonut assets={portfolio.assets} totalValue={portfolio.totalValue} />
        </div>

        {/* Allocation bars */}
        <div className="flex-1 space-y-2 min-w-0">
          {sorted.map(([cls, value], i) => {
            const pct = (value / portfolio.totalValue) * 100
            const color = CLASS_COLORS[cls] ?? '#666'
            return (
              <motion.div
                key={cls}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/60 flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-sm" style={{ background: color }} />
                    {CLASS_LABELS[cls] ?? cls}
                  </span>
                  <span className="text-xs text-white/40">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* Individual positions */}
      <div>
        <p className="text-xs text-white/25 uppercase tracking-widest mb-3">Positions</p>
        <div className="space-y-1">
          {portfolio.assets.slice().sort((a, b) => b.value - a.value).map((asset, i) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between py-1.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: CLASS_COLORS[asset.assetClass] ?? '#666' }}
                />
                <span className="text-xs text-white/70 truncate">{asset.name}</span>
                {asset.ticker && (
                  <span className="text-xs text-white/25 flex-shrink-0">{asset.ticker}</span>
                )}
              </div>
              <span className="text-xs font-medium text-white/80 flex-shrink-0 ml-2">
                {formatCurrency(asset.value)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
