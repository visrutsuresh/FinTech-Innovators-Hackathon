'use client'

import { useChatPanel } from './ChatPanelContext'
import { PANEL_WIDTH as CHAT_PANEL_WIDTH } from './ChatPanel'
import { useFeaturePanel } from './FeaturePanelContext'
import { FEATURE_PANEL_WIDTH } from './FeaturePanel'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isOpen: chatOpen } = useChatPanel()
  const { activePanel } = useFeaturePanel()

  const marginRight = chatOpen
    ? CHAT_PANEL_WIDTH
    : activePanel
      ? FEATURE_PANEL_WIDTH
      : 0

  return (
    <main
      style={{
        marginRight,
        transition: 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </main>
  )
}
