'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useChatPanel } from './ChatPanelContext'
import { useAuth } from './AuthContext'
import { useFeaturePanel } from './FeaturePanelContext'
import { Role } from '@/types'
import { calculateWellnessScore } from '@/lib/wellness'
import AIRecommendations from '@/components/AIRecommendations'

export const PANEL_WIDTH = 380

export default function ChatPanel() {
  const { isOpen, close } = useChatPanel()
  const { user } = useAuth()
  const { clientCtx } = useFeaturePanel()

  const isClient = user?.role === Role.CLIENT
  const isAdviserWithClient = user?.role === Role.ADVISER && !!clientCtx

  // For a logged-in client: use their own portfolio
  // For an adviser viewing a client page: use clientCtx portfolio
  const activePortfolio = isClient
    ? user.portfolio
    : isAdviserWithClient ? clientCtx!.portfolio : null

  const activeRiskProfile = isClient
    ? user.riskProfile
    : isAdviserWithClient ? clientCtx!.riskProfile : null

  const wellnessScore = activePortfolio && activeRiskProfile
    ? calculateWellnessScore(activePortfolio, activeRiskProfile)
    : null

  // Chat history key: client's own ID, or adviser's ID scoped to the viewed client
  const chatKey = isClient
    ? user.id
    : isAdviserWithClient ? `${user!.id}:${clientCtx!.clientId}` : null

  // chatKey is UUID-format only for clients; for advisers we use a namespaced key
  // AIRecommendations uses this as the Supabase client_id — adviser messages stored under adviser.id
  const chatClientId = isClient ? user.id : user?.id ?? ''

  const canChat = (isClient || isAdviserWithClient) && !!wellnessScore

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
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
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(201,162,39,0.12)' }}
              >
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#C9A227" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">AI Adviser</p>
                <p className="text-[10px] text-white/30">
                  {isAdviserWithClient ? `Analysing ${clientCtx!.clientId}` : '⌘L to toggle'}
                </p>
              </div>
            </div>
            <button onClick={close} className="text-white/25 hover:text-white/70 transition-colors">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.15)' }}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#C9A227" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-white/50">
                  {user ? 'Open a client portfolio to chat' : 'Sign in to use the AI adviser'}
                </p>
                <p className="text-xs text-white/25">
                  {user
                    ? 'Navigate to a client dashboard and the AI will have full portfolio context.'
                    : 'The AI adviser analyses your portfolio and answers your financial questions.'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
