'use client'

import { motion } from 'framer-motion'
import AssetDonut from '@/components/charts/AssetDonut'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import type { Portfolio } from '@/types'
import { formatCurrency } from '@/lib/utils'

const CLASS_COLORS: Record<string, string> = {
  stocks: '#457B9D',
  crypto: '#C9A227',
  cash: '#10B981',
  bonds: '#DFD0B8',
  real_estate: '#F97316',
  private: '#C1121F',
}

const CLASS_LABELS: Record<string, string> = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  cash: 'Cash',
  bonds: 'Bonds',
  real_estate: 'Real Estate',
  private: 'Private',
}

function formatQuantity(q: number): string {
  if (q >= 1000) return q.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (q >= 1) return q.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
  return q.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 })
}

interface WealthWalletProps {
  portfolio: Portfolio
  privacyMode?: boolean
}

export default function WealthWallet({ portfolio, privacyMode = false }: WealthWalletProps) {
  const classMap: Record<string, number> = {}
  for (const asset of portfolio.assets) {
    classMap[asset.assetClass] = (classMap[asset.assetClass] || 0) + asset.value
  }

  const sorted = Object.entries(classMap).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-5">
      {/* Net worth */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Total value
          </p>
          {privacyMode && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(201,162,39,0.12)', color: '#C9A227' }}
            >
              Private
            </span>
          )}
        </div>
        <div
          className="text-3xl font-black tabular-nums"
          style={{ color: '#C9A227', letterSpacing: '-0.03em' }}
        >
          {privacyMode ? '••••••' : (
            <>$<AnimatedCounter value={portfolio.totalValue} decimals={2} duration={1200} /></>
          )}
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: 'rgba(255,255,255,0.22)' }}>
          Updated {new Date(portfolio.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Donut + allocation */}
      <div className="flex items-center gap-5">
        <div style={{ width: 156, flexShrink: 0 }}>
          <AssetDonut assets={portfolio.assets} totalValue={portfolio.totalValue} />
        </div>

        <div className="flex-1 space-y-2.5 min-w-0">
          {sorted.map(([cls, value], i) => {
            const pct = portfolio.totalValue > 0 ? (value / portfolio.totalValue) * 100 : 0
            const color = CLASS_COLORS[cls] ?? '#666'
            return (
              <motion.div
                key={cls}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.58)' }}>
                    <span className="inline-block w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                    {CLASS_LABELS[cls] ?? cls}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}bb, ${color})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.75, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
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
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>
          Positions
        </p>
        <div className="space-y-0.5">
          {portfolio.assets.slice().sort((a, b) => b.value - a.value).map((asset, i) => {
            const color = CLASS_COLORS[asset.assetClass] ?? '#666'
            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between py-2 group cursor-default"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.035)' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-xs truncate transition-colors" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {privacyMode
                      ? CLASS_LABELS[asset.assetClass] ?? asset.assetClass
                      : asset.quantity != null && asset.quantity > 0
                        ? `${formatQuantity(asset.quantity)} × ${asset.ticker ?? asset.finageSymbol ?? asset.coinGeckoId ?? asset.name}`
                        : asset.name}
                  </span>
                  {!privacyMode && (asset.ticker ?? asset.finageSymbol ?? asset.coinGeckoId) && asset.quantity == null && (
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.22)' }}>
                      {asset.ticker ?? asset.finageSymbol ?? asset.coinGeckoId}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold flex-shrink-0 ml-3 tabular-nums" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {privacyMode ? '••••' : formatCurrency(asset.value)}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
