'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useFeaturePanel, type FeaturePanelId } from './FeaturePanelContext'
import BlackSwanTester from '@/components/BlackSwanTester'
import FlashLiquidityScorecard from '@/components/FlashLiquidityScorecard'
import LegacyReadiness from '@/components/LegacyReadiness'

const PANEL_WIDTH = 420

const PANEL_META: Record<FeaturePanelId, { title: string; subtitle: string }> = {
  blackswan: { title: 'Black Swan Scenarios', subtitle: 'Stress-test against historical market crashes' },
  flash:     { title: 'Flash Liquidity', subtitle: 'Horizon scorecard + 7-day stress test' },
  legacy:    { title: 'Legacy & Inheritance Readiness', subtitle: 'Estate planning checklist' },
}

export default function FeaturePanel() {
  const { activePanel, clientCtx, closePanel } = useFeaturePanel()

  return (
    <AnimatePresence>
      {activePanel && clientCtx && (
        <motion.div
          key={activePanel}
          initial={{ x: PANEL_WIDTH }}
          animate={{ x: 0 }}
          exit={{ x: PANEL_WIDTH }}
          transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          className="fixed right-0 bottom-0 z-40 flex flex-col"
          style={{
            top: 56,
            width: PANEL_WIDTH,
            background: '#0E0E0E',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div>
              <p className="text-sm font-semibold text-white">{PANEL_META[activePanel].title}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{PANEL_META[activePanel].subtitle}</p>
            </div>
            <button
              onClick={closePanel}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/70 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}
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
              <LegacyReadiness clientId={clientCtx.clientId} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
