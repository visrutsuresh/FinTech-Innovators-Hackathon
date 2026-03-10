'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface CheckItem {
  id: string
  label: string
  description: string
}

const ITEMS: CheckItem[] = [
  { id: 'will', label: 'Will / Testament', description: 'A legally valid will naming beneficiaries' },
  { id: 'nominees', label: 'Nominees Assigned', description: 'All accounts have nominated beneficiaries' },
  { id: 'digital_vault', label: 'Digital Vault', description: 'Private keys & digital credentials documented securely' },
  { id: 'insurance', label: 'Life Insurance Review', description: 'Coverage reviewed within the last 2 years' },
  { id: 'poa', label: 'Power of Attorney', description: 'Lasting POA in place for financial decisions' },
]

interface Props {
  clientId: string
}

export default function LegacyReadiness({ clientId }: Props) {
  const storageKey = `legacy_${clientId}`
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setChecked(JSON.parse(saved))
    } catch {
      // ignore
    }
    setMounted(true)
  }, [storageKey])

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  const score = ITEMS.filter(i => checked[i.id]).length
  const pct = (score / ITEMS.length) * 100

  const scoreColor =
    score === ITEMS.length ? '#10B981'
    : score >= 3 ? '#C9A227'
    : '#EF4444'

  if (!mounted) return null

  return (
    <div className="space-y-4">
      {/* Score arc summary */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0" style={{ width: 64, height: 64 }}>
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="26"
              fill="none"
              stroke={scoreColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
              transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold text-white leading-none">{score}</span>
            <span className="text-[9px] text-white/30">/{ITEMS.length}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: scoreColor }}>
            {score === ITEMS.length ? 'Fully Prepared' : score >= 3 ? 'Partially Prepared' : 'Action Required'}
          </p>
          <p className="text-[10px] text-white/35 leading-snug mt-0.5">
            {score === ITEMS.length
              ? 'Your estate planning is complete.'
              : `Complete ${ITEMS.length - score} more item${ITEMS.length - score !== 1 ? 's' : ''} to secure your legacy.`}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-1.5">
        {ITEMS.map((item, i) => (
          <motion.button
            key={item.id}
            onClick={() => toggle(item.id)}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
            style={{
              background: checked[item.id] ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
              border: checked[item.id] ? '1px solid rgba(16,185,129,0.18)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Checkbox */}
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
              style={{
                background: checked[item.id] ? '#10B981' : 'rgba(255,255,255,0.06)',
                border: checked[item.id] ? 'none' : '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {checked[item.id] && (
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#080808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium" style={{ color: checked[item.id] ? '#10B981' : 'rgba(255,255,255,0.75)' }}>
                {item.label}
              </p>
              <p className="text-[10px] text-white/30 leading-tight mt-0.5">{item.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
