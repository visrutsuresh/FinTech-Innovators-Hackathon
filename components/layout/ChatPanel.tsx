'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useChatPanel } from './ChatPanelContext'
import { useAuth } from './AuthContext'
import { useFeaturePanel } from './FeaturePanelContext'
import { Role } from '@/types'
import { calculateWellnessScore } from '@/lib/wellness'
import AIRecommendations from '@/components/AIRecommendations'
import { GlowingEffect } from '@/components/ui/glowing-effect'

export const PANEL_WIDTH = 380

export default function ChatPanel() {
  const { isOpen, close } = useChatPanel()
  const { user } = useAuth()
  const { clientCtx } = useFeaturePanel()

  const isClient = user?.role === Role.CLIENT
  const isAdviserWithClient = user?.role === Role.ADVISER && !!clientCtx

  const activePortfolio = isClient
    ? user.portfolio
    : isAdviserWithClient ? clientCtx!.portfolio : null

  const activeRiskProfile = isClient
    ? user.riskProfile
    : isAdviserWithClient ? clientCtx!.riskProfile : null

  const wellnessScore = activePortfolio && activeRiskProfile
    ? calculateWellnessScore(activePortfolio, activeRiskProfile)
    : null

  const chatKey = isClient
    ? user.id
    : isAdviserWithClient ? `${user!.id}:${clientCtx!.clientId}` : null

  // When adviser views a client, chat is scoped to that client (history + API). When client, scope to self.
  const chatClientId = isClient ? user!.id : (isAdviserWithClient ? clientCtx!.clientId : user?.id ?? '')

  const canChat = (isClient || isAdviserWithClient) && !!wellnessScore

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: PANEL_WIDTH, opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: PANEL_WIDTH, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="fixed right-0 bottom-0 z-40 flex flex-col"
          style={{
            top: 56,
            width: PANEL_WIDTH,
            background: '#0C0C0C',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '-16px 0 48px rgba(0,0,0,0.5)',
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.015)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(201,162,39,0.14)',
                  border: '1px solid rgba(201,162,39,0.2)',
                }}
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#C9A227" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">AI Adviser</p>
                <p className="text-[10px]" style={{ color: 'var(--text-caption)' }}>
                  {isAdviserWithClient ? `Analysing portfolio` : '⌘L to toggle'}
                </p>
              </div>
            </div>
            <button
              onClick={close}
              className="relative w-7 h-7 rounded-lg flex items-center justify-center transition-all"
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
              <GlowingEffect spread={15} glow={false} disabled={false} proximity={30} inactiveZone={0.01} borderWidth={1} />
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-hidden p-4">
            {canChat ? (
              <AIRecommendations
                key={chatKey ?? chatClientId}
                clientId={chatClientId}
                portfolio={activePortfolio!}
                wellnessScore={wellnessScore!}
                riskProfile={activeRiskProfile!}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(201,162,39,0.08)',
                    border: '1px solid rgba(201,162,39,0.15)',
                  }}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#C9A227" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/60 mb-1.5">
                    {user ? 'Open a client portfolio to chat' : 'Sign in to use the AI adviser'}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-caption)' }}>
                    {user
                      ? 'Navigate to a client dashboard and the AI will have full portfolio context.'
                      : 'The AI adviser analyses your portfolio and answers your financial questions.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
