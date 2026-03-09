'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Client } from '@/types'
import { formatCurrency, getScoreColor } from '@/lib/utils'
import { calculateWellnessScore } from '@/lib/wellness'
import { RiskProfile } from '@/types'

interface ClientTableProps {
  clients: Client[]
}

const RISK_LABEL: Record<RiskProfile, string> = {
  [RiskProfile.CONSERVATIVE]: 'Conservative',
  [RiskProfile.MODERATE]: 'Moderate',
  [RiskProfile.AGGRESSIVE]: 'Aggressive',
}

const RISK_COLOR: Record<RiskProfile, string> = {
  [RiskProfile.CONSERVATIVE]: '#10B981',
  [RiskProfile.MODERATE]: '#C9A227',
  [RiskProfile.AGGRESSIVE]: '#EF4444',
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', maxWidth: 60 }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: getScoreColor(score) }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color: getScoreColor(score) }}>
        {score}
      </span>
    </div>
  )
}

export default function ClientTable({ clients }: ClientTableProps) {
  const router = useRouter()

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {['Client', 'AUM', 'Risk Profile', 'Wellness', 'Status'].map(h => (
              <th
                key={h}
                className="text-left text-xs font-medium py-3 px-5"
                style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em', textTransform: 'uppercase' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map((client, i) => {
            const wellness = calculateWellnessScore(client.portfolio, client.riskProfile)
            const riskColor = RISK_COLOR[client.riskProfile]
            return (
              <motion.tr
                key={client.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => router.push(`/client/${client.id}`)}
                className="cursor-pointer group"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Client */}
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(201,162,39,0.12)', color: '#C9A227' }}
                    >
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
                        {client.name}
                      </p>
                      <p className="text-xs text-white/30">{client.email}</p>
                    </div>
                  </div>
                </td>

                {/* AUM */}
                <td className="py-3.5 px-5">
                  <span className="text-sm font-medium text-white/80">
                    {formatCurrency(client.portfolio.totalValue)}
                  </span>
                </td>

                {/* Risk */}
                <td className="py-3.5 px-5">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: `${riskColor}12`,
                      color: riskColor,
                      border: `1px solid ${riskColor}25`,
                    }}
                  >
                    {RISK_LABEL[client.riskProfile]}
                  </span>
                </td>

                {/* Score */}
                <td className="py-3.5 px-5">
                  <ScoreBar score={wellness.overall} />
                </td>

                {/* Status */}
                <td className="py-3.5 px-5">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: `${getScoreColor(wellness.overall)}12`,
                      color: getScoreColor(wellness.overall),
                      border: `1px solid ${getScoreColor(wellness.overall)}25`,
                    }}
                  >
                    {wellness.label}
                  </span>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
