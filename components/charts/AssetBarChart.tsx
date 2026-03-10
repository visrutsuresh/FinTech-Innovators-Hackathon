'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Asset } from '@/types'
import { formatCurrencyCompact } from '@/lib/utils'

const CLASS_COLORS: Record<string, string> = {
  stocks: '#457B9D',
  crypto: '#C9A227',
  cash: '#10B981',
  bonds: '#DFD0B8',
  real_estate: '#F97316',
  private: '#C1121F',
}

interface AssetBarChartProps {
  assets: Asset[]
}

export default function AssetBarChart({ assets }: AssetBarChartProps) {
  const sorted = [...assets].sort((a, b) => b.value - a.value).slice(0, 8)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={sorted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatCurrencyCompact}
          width={50}
        />
        <Tooltip
          formatter={(value) => [formatCurrencyCompact(Number(value)), 'Value']}
          contentStyle={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'white',
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {sorted.map((entry, index) => (
            <Cell key={index} fill={CLASS_COLORS[entry.assetClass] || '#666'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
