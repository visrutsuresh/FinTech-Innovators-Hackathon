'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Asset } from '@/types'
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

interface AssetDonutProps {
  assets: Asset[]
  totalValue: number
}

export default function AssetDonut({ assets, totalValue }: AssetDonutProps) {
  const classMap: Record<string, number> = {}
  for (const asset of assets) {
    classMap[asset.assetClass] = (classMap[asset.assetClass] || 0) + asset.value
  }

  const data = Object.entries(classMap).map(([cls, value]) => ({
    name: CLASS_LABELS[cls] || cls,
    value,
    percentage: ((value / totalValue) * 100).toFixed(1),
    color: CLASS_COLORS[cls] || '#666',
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value)), 'Value']}
          contentStyle={{
            background: '#1A1A2E',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'white',
          }}
        />
        <Legend
          formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
