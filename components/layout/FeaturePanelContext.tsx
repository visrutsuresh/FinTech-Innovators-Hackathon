'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Portfolio, WellnessScore, RiskProfile } from '@/types'

export type FeaturePanelId = 'blackswan' | 'flash' | 'legacy'

export interface ClientCtx {
  portfolio: Portfolio
  wellnessScore: WellnessScore
  riskProfile: RiskProfile
  clientId: string
}

interface FeaturePanelState {
  activePanel: FeaturePanelId | null
  clientCtx: ClientCtx | null
  privacyMode: boolean
  openPanel: (id: FeaturePanelId) => void
  closePanel: () => void
  togglePrivacy: () => void
  registerClient: (ctx: ClientCtx) => void
  clearClient: () => void
}

const FeaturePanelContext = createContext<FeaturePanelState>({
  activePanel: null,
  clientCtx: null,
  privacyMode: false,
  openPanel: () => {},
  closePanel: () => {},
  togglePrivacy: () => {},
  registerClient: () => {},
  clearClient: () => {},
})

export function FeaturePanelProvider({ children }: { children: ReactNode }) {
  const [activePanel, setActivePanel] = useState<FeaturePanelId | null>(null)
  const [clientCtx, setClientCtx] = useState<ClientCtx | null>(null)
  const [privacyMode, setPrivacyMode] = useState(false)

  const openPanel = useCallback((id: FeaturePanelId) => setActivePanel(id), [])
  const closePanel = useCallback(() => setActivePanel(null), [])
  const togglePrivacy = useCallback(() => setPrivacyMode(p => !p), [])
  const registerClient = useCallback((ctx: ClientCtx) => setClientCtx(ctx), [])
  const clearClient = useCallback(() => {
    setClientCtx(null)
    setActivePanel(null)
    setPrivacyMode(false)
  }, [])

  return (
    <FeaturePanelContext.Provider value={{
      activePanel, clientCtx, privacyMode,
      openPanel, closePanel, togglePrivacy,
      registerClient, clearClient,
    }}>
      {children}
    </FeaturePanelContext.Provider>
  )
}

export function useFeaturePanel() {
  return useContext(FeaturePanelContext)
}
