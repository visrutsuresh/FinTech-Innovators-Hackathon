'use client'

import { useChatPanel } from './ChatPanelContext'
import { PANEL_WIDTH } from './ChatPanel'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isOpen } = useChatPanel()

  return (
    <main
      style={{
        marginRight: isOpen ? PANEL_WIDTH : 0,
        transition: 'margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </main>
  )
}
