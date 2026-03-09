'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import type { WellnessScore } from '@/types'

interface WellnessRadarProps {
  score: WellnessScore
}

export default function WellnessRadar({ score }: WellnessRadarProps) {
  const data = [
    { subject: 'Diversification', value: score.diversification },
    { subject: 'Liquidity', value: score.liquidity },
    { subject: 'Behavioral', value: score.behavioral },
  ]

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
        />
        <Radar
          dataKey="value"
          stroke="#F5C842"
          fill="#F5C842"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
