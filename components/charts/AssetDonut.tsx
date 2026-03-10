'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Asset } from '@/types'
import { formatCurrency } from '@/lib/utils'

const CLASS_COLORS: Record<string, string> = {
  stocks:      '#457B9D',   // steel blue
  crypto:      '#FAA307',   // amber
  cash:        '#2D6A4F',   // green
  bonds:       '#DFD0B8',   // cream
  real_estate: '#948979',   // taupe
  private:     '#C1121F',   // red
}

const CLASS_LABELS: Record<string, string> = {
  stocks: 'Stocks',
  crypto: 'Crypto',
  cash: 'Cash',
  bonds: 'Bonds',
  real_estate: 'Real Estate',
  private: 'Private',
}

interface AssetDonutProps {
  assets: Asset[]
  totalValue: number
}

export default function AssetDonut({ assets, totalValue }: AssetDonutProps) {
  const classMap: Record<string, number> = {}
  for (const asset of assets) {
    classMap[asset.assetClass] = (classMap[asset.assetClass] || 0) + asset.value
  }

  const safeTotal = totalValue > 0 ? totalValue : 1
  const data = Object.entries(classMap).map(([cls, value]) => ({
    name: CLASS_LABELS[cls] || cls,
    value,
    percentage: ((value / safeTotal) * 100).toFixed(1),
    color: CLASS_COLORS[cls] || '#666',
  }))

  return (
    <ResponsiveContainer width="100%" height={150}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={42}
          outerRadius={66}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), 'Value']}
          contentStyle={{
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '12px',
            padding: '6px 10px',
          }}
          itemStyle={{ color: 'rgba(255,255,255,0.7)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
