'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Client } from '@/types'
import { formatCurrency, getScoreColor } from '@/lib/utils'
import { calculateWellnessScore } from '@/lib/wellness'
import { RiskProfile } from '@/types'
import AnimatedCounter from '@/components/ui/AnimatedCounter'

interface ClientTableProps {
  clients: Client[]
  privacyMode?: boolean
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

function MiniScoreGauge({ score }: { score: number }) {
  const color = getScoreColor(score)
  const circumference = 2 * Math.PI * 12
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
          <motion.circle
            cx="16" cy="16" r="12"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            transform="rotate(-90 16 16)"
            style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold tabular-nums" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{score}</span>
    </div>
  )
}

export default function ClientTable({ clients, privacyMode = false }: ClientTableProps) {
  const router = useRouter()

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.3)" strokeWidth="1.7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-white/50 mb-1">No clients yet</p>
        <p className="text-xs text-white/25">Clients who link to your adviser account will appear here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {['Client', 'AUM', 'Risk Profile', 'Wellness', 'Status'].map(h => (
              <th
                key={h}
                className="text-left py-3 px-6 text-[11px] font-semibold uppercase"
                style={{ color: 'var(--text-caption)', letterSpacing: '0.07em' }}
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
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.055, duration: 0.35, ease: 'easeOut' }}
                onClick={() => router.push(`/client/${client.id}`)}
                className="cursor-pointer group relative"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                  const borderEl = e.currentTarget
                  borderEl.style.borderLeftColor = '#C9A227'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderLeftColor = 'transparent'
                }}
              >
                {/* Left gold border on hover */}
                <td className="py-3.5 pl-6 pr-4" style={{ width: '1px', paddingRight: 0 }}>
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: '#C9A227' }}
                  />
                </td>

                {/* Client */}
                <td className="py-3.5 pl-5 pr-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: 'rgba(201,162,39,0.12)', color: '#C9A227' }}
                    >
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {client.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-caption)' }}>{client.email}</p>
                    </div>
                  </div>
                </td>

                {/* AUM */}
                <td className="py-3.5 px-4">
                  <span className="text-sm font-semibold tabular-nums" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {privacyMode ? '••••' : formatCurrency(client.portfolio.totalValue)}
                  </span>
                </td>

                {/* Risk */}
                <td className="py-3.5 px-4">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: `${riskColor}10`,
                      color: riskColor,
                      border: `1px solid ${riskColor}22`,
                    }}
                  >
                    {RISK_LABEL[client.riskProfile]}
                  </span>
                </td>

                {/* Wellness */}
                <td className="py-3.5 px-4">
                  <MiniScoreGauge score={wellness.overall} />
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: `${getScoreColor(wellness.overall)}10`,
                      color: getScoreColor(wellness.overall),
                      border: `1px solid ${getScoreColor(wellness.overall)}22`,
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
