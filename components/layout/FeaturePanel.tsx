'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useFeaturePanel, type FeaturePanelId } from './FeaturePanelContext'
import { useAuth, Role } from './AuthContext'
import BlackSwanTester from '@/components/BlackSwanTester'
import FlashLiquidityScorecard from '@/components/FlashLiquidityScorecard'
import LegacyReadiness from '@/components/LegacyReadiness'

export const FEATURE_PANEL_WIDTH = 420

const PANEL_META: Record<FeaturePanelId, { title: string; subtitle: string; iconPath: string }> = {
  blackswan: {
    title: 'Black Swan Scenarios',
    subtitle: 'Stress-test against historical market crashes',
    iconPath: 'M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181',
  },
  flash: {
    title: 'Flash Liquidity',
    subtitle: 'Horizon scorecard + 7-day stress test',
    iconPath: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  },
  legacy: {
    title: 'Legacy & Inheritance Readiness',
    subtitle: 'Estate planning checklist',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
}

export default function FeaturePanel() {
  const { activePanel, clientCtx, closePanel } = useFeaturePanel()
  const { user } = useAuth()
  const isAdviser = user?.role === Role.ADVISER

  return (
    <AnimatePresence>
      {activePanel && clientCtx && (
        <motion.div
          key={activePanel}
          initial={{ x: FEATURE_PANEL_WIDTH, opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: FEATURE_PANEL_WIDTH, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="fixed right-0 bottom-0 z-40 flex flex-col"
          style={{
            top: 56,
            width: FEATURE_PANEL_WIDTH,
            background: '#0C0C0C',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '-16px 0 48px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.015)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.2)' }}
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#C9A227" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={PANEL_META[activePanel].iconPath} />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{PANEL_META[activePanel].title}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  {PANEL_META[activePanel].subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={closePanel}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
              }}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {activePanel === 'blackswan' && (
              <BlackSwanTester
                portfolio={clientCtx.portfolio}
                riskProfile={clientCtx.riskProfile}
                baseScore={clientCtx.wellnessScore}
              />
            )}
            {activePanel === 'flash' && (
              <FlashLiquidityScorecard portfolio={clientCtx.portfolio} />
            )}
            {activePanel === 'legacy' && (
              <LegacyReadiness clientId={clientCtx.clientId} isAdviser={isAdviser} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
