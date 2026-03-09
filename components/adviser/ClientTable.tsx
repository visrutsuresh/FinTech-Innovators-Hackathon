'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import type { Client } from '@/types'
import { formatCurrency, getScoreColor } from '@/lib/utils'
import { calculateWellnessScore } from '@/lib/wellness'
import { RiskProfile } from '@/types'

interface ClientTableProps {
  clients: Client[]
}

function getWellnessBadgeVariant(score: number): 'emerald' | 'gold' | 'orange' | 'red' {
  if (score >= 70) return 'emerald'
  if (score >= 50) return 'gold'
  if (score >= 30) return 'orange'
  return 'red'
}

function getRiskBadgeVariant(risk: RiskProfile): 'emerald' | 'gold' | 'red' {
  if (risk === RiskProfile.CONSERVATIVE) return 'emerald'
  if (risk === RiskProfile.MODERATE) return 'gold'
  return 'red'
}

export default function ClientTable({ clients }: ClientTableProps) {
  const router = useRouter()

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Client', 'Portfolio Value', 'Risk Profile', 'Wellness Score', 'Status'].map(h => (
              <th
                key={h}
                className="text-left text-xs font-semibold uppercase tracking-widest py-3 px-4"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map((client, i) => {
            const wellness = calculateWellnessScore(client.portfolio, client.riskProfile)
            return (
              <motion.tr
                key={client.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => router.push(`/client/${client.id}`)}
                className="cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'rgba(245,200,66,0.15)', color: '#C9A227' }}
                    >
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{client.name}</p>
                      <p className="text-xs text-white/40">{client.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-white">
                    {formatCurrency(client.portfolio.totalValue)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <Badge variant={getRiskBadgeVariant(client.riskProfile)}>
                    {client.riskProfile}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{ color: getScoreColor(wellness.overall) }}
                    >
                      {wellness.overall}
                    </span>
                    <span className="text-xs text-white/40">/ 100</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Badge variant={getWellnessBadgeVariant(wellness.overall)}>
                    {wellness.label}
                  </Badge>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
