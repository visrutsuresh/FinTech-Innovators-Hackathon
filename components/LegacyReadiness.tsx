'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface CheckItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
}

const ITEMS: CheckItem[] = [
  {
    id: 'will',
    label: 'Will / Testament',
    description: 'A legally valid will naming beneficiaries',
    icon: (
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'nominees',
    label: 'Nominees Assigned',
    description: 'All accounts have nominated beneficiaries',
    icon: (
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'digital_vault',
    label: 'Digital Vault',
    description: 'Private keys & digital credentials documented securely',
    icon: (
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    id: 'insurance',
    label: 'Life Insurance Review',
    description: 'Coverage reviewed within the last 2 years',
    icon: (
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    id: 'poa',
    label: 'Power of Attorney',
    description: 'Lasting POA in place for financial decisions',
    icon: (
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
  },
]

interface Props {
  clientId: string
  isAdviser?: boolean
}

export default function LegacyReadiness({ clientId, isAdviser = false }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('legacy_checklist')
      .eq('id', clientId)
      .single()
      .then(({ data }) => {
        if (data?.legacy_checklist) setChecked(data.legacy_checklist as Record<string, boolean>)
        setMounted(true)
      })
  }, [clientId])

  const toggle = (id: string) => {
    if (isAdviser) return
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      supabase.from('profiles').update({ legacy_checklist: next }).eq('id', clientId).then(() => {})
      return next
    })
  }

  const score = ITEMS.filter(i => checked[i.id]).length
  const pct = (score / ITEMS.length) * 100

  const scoreColor =
    score === ITEMS.length ? '#10B981'
    : score >= 3 ? '#C9A227'
    : '#EF4444'

  const scoreLabel =
    score === ITEMS.length ? 'Fully Prepared'
    : score >= 3 ? 'Partially Prepared'
    : 'Action Required'

  if (!mounted) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton h-14 rounded-xl" />
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Score summary */}
      <div
        className="rounded-xl p-4 flex items-center gap-4"
        style={{ background: `${scoreColor}08`, border: `1px solid ${scoreColor}18` }}
      >
        {/* Arc */}
        <div className="relative flex-shrink-0" style={{ width: 60, height: 60 }}>
          <svg viewBox="0 0 60 60" width="60" height="60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <motion.circle
              cx="30" cy="30" r="24"
              fill="none"
              stroke={scoreColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - pct / 100) }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              transform="rotate(-90 30 30)"
              style={{ filter: `drop-shadow(0 0 4px ${scoreColor}80)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold leading-none" style={{ color: scoreColor }}>{score}</span>
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>/{ITEMS.length}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: scoreColor }}>{scoreLabel}</p>
          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {isAdviser
              ? 'Client-managed checklist'
              : score === ITEMS.length
                ? 'Your estate planning is complete.'
                : `Complete ${ITEMS.length - score} more item${ITEMS.length - score !== 1 ? 's' : ''} to secure your legacy.`}
          </p>
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {ITEMS.map((item, i) => {
          const done = checked[item.id]
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`w-full flex items-start gap-3 rounded-xl px-3.5 py-3 text-left transition-all ${!isAdviser ? 'cursor-pointer' : ''}`}
              style={{
                background: done ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.025)',
                border: done ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}
              onClick={!isAdviser ? () => toggle(item.id) : undefined}
              onMouseEnter={!isAdviser ? (e) => {
                if (!done) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.15)'
              } : undefined}
              onMouseLeave={!isAdviser ? (e) => {
                if (!done) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
              } : undefined}
            >
              {/* Checkbox */}
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                style={{
                  background: done ? '#10B981' : 'rgba(255,255,255,0.06)',
                  border: done ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  boxShadow: done ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
                }}
              >
                <AnimatePresence>
                  {done && (
                    <motion.svg
                      key="check"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      width="10" height="10" viewBox="0 0 12 12" fill="none"
                    >
                      <path d="M2 6l3 3 5-5" stroke="#080808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  )}
                </AnimatePresence>
                {!done && (
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>{item.icon}</span>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium transition-colors" style={{ color: done ? '#10B981' : 'rgba(255,255,255,0.78)' }}>
                  {item.label}
                </p>
                <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  {item.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
