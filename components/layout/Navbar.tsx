'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth, Role } from './AuthContext'
import { useChatPanel } from './ChatPanelContext'
import { useFeaturePanel, type FeaturePanelId } from './FeaturePanelContext'

// Icon definitions for feature panels
const FEATURE_ICONS: { id: FeaturePanelId; title: string; path: string }[] = [
  {
    id: 'blackswan',
    title: 'Black Swan Scenarios',
    // Trending down / crash arrow
    path: 'M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181',
  },
  {
    id: 'flash',
    title: 'Flash Liquidity & Stress Test',
    // Lightning bolt
    path: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z',
  },
  {
    id: 'legacy',
    title: 'Legacy & Inheritance Readiness',
    // Document with lines
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
]

export default function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const { isOpen, toggle } = useChatPanel()
  const { activePanel, clientCtx, privacyMode, openPanel, closePanel, togglePrivacy } = useFeaturePanel()
  const router = useRouter()
  const pathname = usePathname()
  const onProfile = pathname === '/profile'

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
            {onProfile && user.role === Role.ADVISER && (
              <Link
                href="/adviser"
                className="text-xs text-white/50 hover:text-white/90 transition-colors hidden sm:block"
              >
                Dashboard
              </Link>
            )}
            {onProfile && user.role === Role.CLIENT && (
              <Link
                href={`/client/${user.id}`}
                className="text-xs text-white/50 hover:text-white/90 transition-colors hidden sm:block"
              >
                Dashboard
              </Link>
            )}

            {/* Feature panel icons — only when a client page has registered its data */}
            {clientCtx && (
              <div className="flex items-center gap-1">
                {FEATURE_ICONS.map(({ id, title, path }) => {
                  const active = activePanel === id
                  return (
                    <button
                      key={id}
                      onClick={() => active ? closePanel() : openPanel(id)}
                      title={title}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        background: active ? 'rgba(201,162,39,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? 'rgba(201,162,39,0.35)' : 'rgba(255,255,255,0.08)'}`,
                        color: active ? '#C9A227' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={path} />
                      </svg>
                    </button>
                  )
                })}

                {/* Privacy toggle — adviser only */}
                {user?.role === Role.ADVISER && (
                  <button
                    onClick={togglePrivacy}
                    title={privacyMode ? 'Privacy mode on — click to reveal' : 'Enable privacy mode'}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      background: privacyMode ? 'rgba(201,162,39,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${privacyMode ? 'rgba(201,162,39,0.35)' : 'rgba(255,255,255,0.08)'}`,
                      color: privacyMode ? '#C9A227' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {privacyMode ? (
                        <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      ) : (
                        <>
                          <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </>
                      )}
                    </svg>
                  </button>
                )}

                <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
            )}

            {/* Profile link */}
            <button
              onClick={() => router.push('/profile')}
              title="My Profile"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: onProfile ? 'rgba(201,162,39,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${onProfile ? 'rgba(201,162,39,0.35)' : 'rgba(255,255,255,0.08)'}`,
                color: onProfile ? '#C9A227' : 'rgba(255,255,255,0.4)',
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>

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
