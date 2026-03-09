'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { mockClients } from '@/lib/mock-data'
import ClientTable from '@/components/adviser/ClientTable'
import SummaryStats from '@/components/adviser/SummaryStats'
import { Role } from '@/types'

export default function AdviserPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== Role.ADVISER)) {
      router.replace('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#080808' }}>
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#C9A227', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 md:px-8 pt-20 pb-16" style={{ background: '#080808' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 pt-4"
        >
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-1">Adviser Dashboard</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Good day, <span style={{ color: '#C9A227' }}>{user.name}</span>
            </h1>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="mb-8">
          <SummaryStats clients={mockClients} />
        </div>

        {/* Client roster */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#0E0E0E', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div>
              <h2 className="text-sm font-semibold text-white">Client Roster</h2>
              <p className="text-xs text-white/35 mt-0.5">
                {mockClients.length} clients · click a row to open the full report
              </p>
            </div>
          </div>
          <ClientTable clients={mockClients} />
        </div>
      </div>
    </div>
  )
}
