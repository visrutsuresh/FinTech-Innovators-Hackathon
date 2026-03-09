'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/layout/AuthContext'
import { mockClients } from '@/lib/mock-data'
import ClientTable from '@/components/adviser/ClientTable'
import SummaryStats from '@/components/adviser/SummaryStats'
import GlassCard from '@/components/ui/GlassCard'
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white/40">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 md:px-8 pt-24 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white">
          Good day, <span style={{ color: '#F5C842' }}>{user.name}</span>
        </h1>
        <p className="text-white/50 mt-1">Here&apos;s your client portfolio overview</p>
      </motion.div>

      {/* Summary Stats */}
      <div className="mb-8">
        <SummaryStats clients={mockClients} />
      </div>

      {/* Client Table */}
      <GlassCard className="p-0" animate={false}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-lg font-semibold text-white">Client Portfolio</h2>
          <p className="text-sm text-white/40 mt-0.5">Click a client to view their full wellness report</p>
        </div>
        <div className="p-6">
          <ClientTable clients={mockClients} />
        </div>
      </GlassCard>
    </div>
  )
}
