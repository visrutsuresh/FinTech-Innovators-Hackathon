'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface ChatPanelState {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const ChatPanelContext = createContext<ChatPanelState>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
})

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(p => !p)
  const close = () => setIsOpen(false)

  // Ctrl+L global shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'l') {
        e.preventDefault()
        setIsOpen(p => !p)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <ChatPanelContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </ChatPanelContext.Provider>
  )
}

export function useChatPanel() {
  return useContext(ChatPanelContext)
}
