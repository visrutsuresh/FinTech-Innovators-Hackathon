'use client'

import { motion } from 'framer-motion'
import AssetDonut from '@/components/charts/AssetDonut'
import AssetBarChart from '@/components/charts/AssetBarChart'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import type { Portfolio } from '@/types'
import { formatCurrency } from '@/lib/utils'

const CLASS_COLORS: Record<string, string> = {
  stocks: '#3B82F6',
  crypto: '#F5C842',
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

  return (
    <div className="space-y-6">
      {/* Net Worth */}
      <div className="text-center">
        <p className="text-sm text-white/50 uppercase tracking-widest mb-1">Total Portfolio Value</p>
        <div className="text-4xl font-bold" style={{ color: '#F5C842' }}>
          $<AnimatedCounter value={portfolio.totalValue} duration={1500} />
        </div>
        <p className="text-xs text-white/30 mt-1">
          Last updated: {new Date(portfolio.lastUpdated).toLocaleDateString()}
        </p>
      </div>

      {/* Donut Chart */}
      <AssetDonut assets={portfolio.assets} totalValue={portfolio.totalValue} />

      {/* Class Breakdown */}
      <div className="space-y-2">
        {Object.entries(classMap).map(([cls, value], i) => (
          <motion.div
            key={cls}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between py-2 px-3 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: CLASS_COLORS[cls] || '#666' }}
              />
              <span className="text-sm text-white/80">{CLASS_LABELS[cls] || cls}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">
                {((value / portfolio.totalValue) * 100).toFixed(1)}%
              </span>
              <span className="text-sm font-medium text-white">{formatCurrency(value)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bar Chart */}
      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest mb-3">Individual Positions</p>
        <AssetBarChart assets={portfolio.assets} />
      </div>
    </div>
  )
}
