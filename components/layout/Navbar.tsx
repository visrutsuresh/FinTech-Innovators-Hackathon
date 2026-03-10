'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  Home,
  TrendingDown,
  Zap,
  ScrollText,
  Eye,
  EyeOff,
  User,
  Sparkles,
  LogOut,
} from 'lucide-react'
import { useAuth, Role } from './AuthContext'
import { useChatPanel } from './ChatPanelContext'
import { useFeaturePanel, type FeaturePanelId } from './FeaturePanelContext'
import { ExpandableTabs, type TabItem } from '@/components/ui/expandable-tabs'
import { GlowingEffect } from '@/components/ui/glowing-effect'

export default function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const { isOpen: chatOpen, toggle: toggleChat } = useChatPanel()
  const { activePanel, clientCtx, privacyMode, openPanel, closePanel, togglePrivacy } = useFeaturePanel()
  const router = useRouter()
  const pathname = usePathname()
  const onProfile = pathname === '/profile'
  const onLanding = pathname === '/'
  const onAuthPage = pathname?.startsWith('/auth')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Stable toggle — won't go stale because closePanel/openPanel are useCallback from context
  const togglePanel = useCallback((id: FeaturePanelId) => {
    if (activePanel === id) closePanel()
    else openPanel(id)
  }, [activePanel, closePanel, openPanel])

  // Are we already on a dashboard? → hide the Home tab
  const onAdviserDashboard = pathname === '/adviser'
  const onClientDashboard  = !!user?.id && pathname === `/client/${user.id}`

  // Derive the "home" dashboard URL for the current user
  const dashboardUrl = user?.role === Role.ADVISER ? '/adviser' : `/client/${user?.id}`

  // Profile click: if already on profile, go back to dashboard; otherwise navigate to /profile
  const handleProfileClick = useCallback(() => {
    if (onProfile) router.push(dashboardUrl)
    else router.push('/profile')
  }, [onProfile, dashboardUrl, router])

  // ── Tab definitions ──────────────────────────────────────────────────────────

  // When a logged-in user visits the landing page — Dashboard shortcut + Profile only
  const landingTabs: TabItem[] = useMemo(() => [
    { title: 'Dashboard', icon: Home, onClick: () => router.push(dashboardUrl) },
    { title: 'Profile',   icon: User, onClick: handleProfileClick },
  ], [dashboardUrl, handleProfileClick, router])

  // When on the profile page — show only Dashboard + Profile (no feature panels)
  const profilePageTabs: TabItem[] = useMemo(() => [
    { title: 'Dashboard', icon: Home, onClick: () => router.push(dashboardUrl) },
    { type: 'separator' },
    { title: 'Profile', icon: User, onClick: handleProfileClick },
  ], [dashboardUrl, handleProfileClick, router])

  // ADVISER viewing a specific client (always show Home → back to /adviser)
  const adviserClientTabs: TabItem[] = useMemo(() => [
    { title: 'Dashboard',  icon: Home,        onClick: () => router.push('/adviser') },
    { title: 'Black Swan', icon: TrendingDown, onClick: () => togglePanel('blackswan') },
    { title: 'Liquidity',  icon: Zap,          onClick: () => togglePanel('flash') },
    { title: 'Legacy',     icon: ScrollText,   onClick: () => togglePanel('legacy') },
    { title: 'AI Adviser', icon: Sparkles,     onClick: toggleChat },
    { type: 'separator' },
    { title: 'Privacy',    icon: privacyMode ? EyeOff : Eye, onClick: togglePrivacy },
    { title: 'Profile',    icon: User,         onClick: handleProfileClick },
  ], [togglePanel, privacyMode, togglePrivacy, handleProfileClick, toggleChat])

  // ADVISER overview — omit Home when already on /adviser
  const adviserTabs: TabItem[] = useMemo(() => {
    const items: TabItem[] = []
    if (!onAdviserDashboard) items.push({ title: 'Dashboard', icon: Home, onClick: () => router.push('/adviser') })
    items.push({ title: 'AI Adviser', icon: Sparkles, onClick: toggleChat })
    items.push({ type: 'separator' })
    items.push({ title: 'Profile', icon: User, onClick: handleProfileClick })
    return items
  }, [onAdviserDashboard, handleProfileClick, toggleChat])

  // CLIENT — omit Home when already on their own dashboard
  const clientTabs: TabItem[] = useMemo(() => {
    const items: TabItem[] = []
    if (!onClientDashboard) items.push({ title: 'Dashboard', icon: Home, onClick: () => router.push(`/client/${user?.id}`) })
    items.push({ title: 'Black Swan', icon: TrendingDown, onClick: () => togglePanel('blackswan') })
    items.push({ title: 'Liquidity',  icon: Zap,          onClick: () => togglePanel('flash') })
    items.push({ title: 'Legacy',     icon: ScrollText,   onClick: () => togglePanel('legacy') })
    items.push({ title: 'AI Adviser', icon: Sparkles,     onClick: toggleChat })
    items.push({ type: 'separator' })
    items.push({ title: 'Profile',    icon: User,         onClick: handleProfileClick })
    return items
  }, [onClientDashboard, user?.id, togglePanel, handleProfileClick, toggleChat])

  // tabs must be declared before activeIndex (which reads it)
  const tabs =
    onLanding                                 ? (user ? landingTabs : null)
    : onProfile                               ? profilePageTabs
    : user?.role === Role.ADVISER && clientCtx ? adviserClientTabs
    : user?.role === Role.ADVISER             ? adviserTabs
    : user?.role === Role.CLIENT              ? clientTabs
    : null

  // ── Active index — resolved by title so adding/removing tabs never breaks it ─
  const activeIndex = useMemo((): number | null => {
    if (!user || !tabs) return null
    const find = (title: string) => tabs.findIndex(t => !('type' in t) && (t as { title: string }).title === title)

    if (activePanel === 'blackswan')               return find('Black Swan')
    if (activePanel === 'flash')                   return find('Liquidity')
    if (activePanel === 'legacy')                  return find('Legacy')
    if (privacyMode && user.role === Role.ADVISER) return find('Privacy')
    if (onProfile)                                 return find('Profile')
    if (chatOpen)                                  return find('AI Adviser')
    return null
  }, [user, tabs, activePanel, privacyMode, onProfile, chatOpen])

  return (
    <motion.nav
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 grid items-center px-5 h-14"
      style={{
        gridTemplateColumns: '1fr auto 1fr',
        background: scrolled ? 'rgba(13,13,13,0.97)' : 'rgba(13,13,13,0.88)',
        backdropFilter: 'blur(20px) saturate(1.4)',
        borderBottom: scrolled
          ? '1px solid rgba(223,208,184,0.08)'
          : '1px solid rgba(223,208,184,0.04)',
        transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        boxShadow: scrolled ? '0 4px 28px rgba(0,0,0,0.5)' : 'none',
      } as CSSProperties}
    >
      {/* ── Col 1: Logo ── */}
      <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-transform group-hover:scale-105"
          style={{ background: '#DFD0B8', color: '#0D0D0D' }}
        >
          H
        </div>
        <span className="font-ballet text-base text-white" style={{ lineHeight: 1 }}>Huat</span>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md hidden sm:block"
          style={{ background: 'rgba(223,208,184,0.08)', color: '#DFD0B8', letterSpacing: '0.06em' }}
        >
          BETA
        </span>
      </Link>

      {/* ── Col 2: Centre tabs ── */}
      {!isLoading && user && tabs ? (
        <ExpandableTabs
          tabs={tabs}
          activeIndex={activeIndex}
          onChange={() => {/* driven by onClick per tab */}}
        />
      ) : (
        <div />
      )}

      {/* ── Col 3: Right actions ── */}
      <div className="flex items-center gap-2 justify-end">
        {!isLoading && user ? (
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="relative flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
            style={{
              color: 'rgba(255,255,255,0.3)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
            }}
          >
            <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
            <LogOut size={13} strokeWidth={1.8} />
            <span className="hidden sm:block">Sign out</span>
          </motion.button>
        ) : !onAuthPage ? (
          <>
            <Link
              href="/auth/login"
              className="text-sm transition-colors"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              Sign in
            </Link>
            <div className="relative rounded-xl">
              <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={1} />
              <Link
                href="/auth/signup"
                className="relative text-sm px-4 py-1.5 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-95 inline-block"
                style={{ background: '#DFD0B8', color: '#0D0D0D' }}
              >
                Get started
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </motion.nav>
  )
}
