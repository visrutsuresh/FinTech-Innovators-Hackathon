'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth, Role } from './AuthContext'
import { useChatPanel } from './ChatPanelContext'

export default function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const { isOpen, toggle } = useChatPanel()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-0 h-14"
      style={{
        background: 'rgba(8,8,8,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black"
          style={{ background: '#C9A227', color: '#080808' }}
        >
          H
        </div>
        <span className="text-sm font-bold tracking-tight text-white">Huat</span>
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(201,162,39,0.12)', color: '#C9A227', letterSpacing: '0.04em' }}
        >
          BETA
        </span>
      </Link>

      {/* Right */}
      <div className="flex items-center gap-3">
        {user && !isLoading ? (
          <>
            <div className="hidden sm:flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(201,162,39,0.15)', color: '#C9A227' }}
              >
                {user.name.charAt(0)}
              </div>
              <span className="text-sm text-white/70">{user.name}</span>
            </div>

            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                background: user.role === Role.ADVISER
                  ? 'rgba(201,162,39,0.1)'
                  : 'rgba(16,185,129,0.1)',
                color: user.role === Role.ADVISER ? '#C9A227' : '#10B981',
                border: `1px solid ${user.role === Role.ADVISER ? 'rgba(201,162,39,0.2)' : 'rgba(16,185,129,0.2)'}`,
              }}
            >
              {user.role === Role.ADVISER ? 'Adviser' : 'Client'}
            </span>

            {user.role === Role.ADVISER && (
              <Link
                href="/adviser"
                className="text-xs text-white/50 hover:text-white/90 transition-colors hidden sm:block"
              >
                Dashboard
              </Link>
            )}

            {/* AI chat toggle — star icon */}
            <button
              onClick={toggle}
              title={`${isOpen ? 'Close' : 'Open'} AI Adviser (⌘L)`}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: isOpen ? 'rgba(201,162,39,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isOpen ? 'rgba(201,162,39,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: isOpen ? '#C9A227' : 'rgba(255,255,255,0.4)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={isOpen ? '#C9A227' : 'none'} stroke={isOpen ? '#C9A227' : 'currentColor'} strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </button>

            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg transition-all hover:text-white text-white/50"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm px-4 py-1.5 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{ background: '#C9A227', color: '#080808' }}
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  )
}
