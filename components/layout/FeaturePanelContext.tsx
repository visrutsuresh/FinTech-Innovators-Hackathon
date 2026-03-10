'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Portfolio, WellnessScore, RiskProfile } from '@/types'

export type FeaturePanelId = 'blackswan' | 'flash' | 'legacy'

export interface ClientCtx {
  portfolio: Portfolio
  wellnessScore: WellnessScore
  riskProfile: RiskProfile
  clientId: string
  /** When true, adviser sees masked amounts; set from profile when client loads */
  hideAmountsFromAdviser?: boolean
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

  // Load per-client privacy flag whenever the active client changes.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!clientCtx?.clientId) {
      setPrivacyMode(false)
      return
    }
    if (clientCtx.hideAmountsFromAdviser !== undefined) {
      setPrivacyMode(clientCtx.hideAmountsFromAdviser)
      localStorage.setItem(`huat:privacyMode:${clientCtx.clientId}`, String(clientCtx.hideAmountsFromAdviser))
      return
    }
    const stored = localStorage.getItem(`huat:privacyMode:${clientCtx.clientId}`)
    setPrivacyMode(stored === 'true')
  }, [clientCtx?.clientId, clientCtx?.hideAmountsFromAdviser])

  const openPanel = useCallback((id: FeaturePanelId) => setActivePanel(id), [])
  const closePanel = useCallback(() => setActivePanel(null), [])
  const togglePrivacy = useCallback(() => {
    setPrivacyMode(prev => {
      const next = !prev
      if (typeof window !== 'undefined' && clientCtx?.clientId) {
        localStorage.setItem(`huat:privacyMode:${clientCtx.clientId}`, String(next))
      }
      return next
    })
  }, [clientCtx?.clientId])
  const registerClient = useCallback((ctx: ClientCtx) => setClientCtx(ctx), [])
  const clearClient = useCallback(() => {
    setClientCtx(null)
    setActivePanel(null)
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
