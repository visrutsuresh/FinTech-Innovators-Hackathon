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
import { supabase } from '@/lib/supabase'
import { useChatPanel } from './ChatPanelContext'
import { useFeaturePanel, type FeaturePanelId } from './FeaturePanelContext'
import { ExpandableTabs, type TabItem } from '@/components/ui/expandable-tabs'
import { GlowingEffect } from '@/components/ui/glowing-effect'

export default function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const isClient = user?.role === Role.CLIENT
  const { isOpen: chatOpen, toggle: toggleChat, close: closeChat } = useChatPanel()
  const { activePanel, clientCtx, privacyMode, openPanel, closePanel, togglePrivacy } = useFeaturePanel()
  const router = useRouter()
  const pathname = usePathname()
  const onProfile = pathname === '/profile'
  const onLanding = pathname === '/'
  const onAuthPage = pathname?.startsWith('/auth')
  const [scrolled, setScrolled] = useState(false)
  const [privacyBarExpanded, setPrivacyBarExpanded] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])


  // On logout, navigate to landing page immediately and clear auth in the background
  const handleLogout = useCallback(() => {
    router.push('/')
    void logout()
  }, [logout, router])

  // Mutually-exclusive toggles — only one right-side panel open at a time
  const togglePanel = useCallback((id: FeaturePanelId) => {
    if (activePanel === id) {
      closePanel()
    } else {
      closeChat()   // dismiss AI chat before opening a feature panel
      openPanel(id)
    }
  }, [activePanel, closeChat, closePanel, openPanel])

  const handleToggleChat = useCallback(() => {
    if (chatOpen) {
      closeChat()
    } else {
      closePanel()  // dismiss any feature panel before opening AI chat
      toggleChat()
    }
  }, [chatOpen, closeChat, closePanel, toggleChat])

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

  // When a logged-in user visits the landing page — Home (dashboard shortcut) + Profile only
  const landingTabs: TabItem[] = useMemo(() => [
    { title: 'Home', icon: Home, onClick: () => router.push(dashboardUrl) },
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
    { title: 'AI Adviser', icon: Sparkles,     onClick: handleToggleChat },
    { type: 'separator' },
    { title: 'Profile',    icon: User,         onClick: handleProfileClick },
  ], [togglePanel, handleProfileClick, handleToggleChat])

  // ADVISER overview — omit Home when already on /adviser
  const adviserTabs: TabItem[] = useMemo(() => {
    const items: TabItem[] = []
    if (!onAdviserDashboard) items.push({ title: 'Dashboard', icon: Home, onClick: () => router.push('/adviser') })
    items.push({ title: 'AI Adviser', icon: Sparkles, onClick: handleToggleChat })
    items.push({ type: 'separator' })
    items.push({ title: 'Profile', icon: User, onClick: handleProfileClick })
    return items
  }, [onAdviserDashboard, handleProfileClick, handleToggleChat])

  // CLIENT — omit Home when already on their own dashboard
  const clientTabs: TabItem[] = useMemo(() => {
    const items: TabItem[] = []
    if (!onClientDashboard) items.push({ title: 'Dashboard', icon: Home, onClick: () => router.push(`/client/${user?.id}`) })
    items.push({ title: 'Black Swan', icon: TrendingDown, onClick: () => togglePanel('blackswan') })
    items.push({ title: 'Liquidity',  icon: Zap,          onClick: () => togglePanel('flash') })
    items.push({ title: 'Legacy',     icon: ScrollText,   onClick: () => togglePanel('legacy') })
    items.push({ title: 'Privacy',    icon: privacyMode ? EyeOff : Eye, onClick: () => setPrivacyBarExpanded(p => !p) })
    items.push({ title: 'AI Adviser', icon: Sparkles,                   onClick: handleToggleChat })
    items.push({ type: 'separator' })
    items.push({ title: 'Profile',    icon: User,         onClick: handleProfileClick })
    return items
  }, [onClientDashboard, user?.id, togglePanel, privacyMode, handleProfileClick, handleToggleChat])

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

    if (activePanel === 'blackswan') return find('Black Swan')
    if (activePanel === 'flash')     return find('Liquidity')
    if (activePanel === 'legacy')    return find('Legacy')
    if (privacyBarExpanded && user.role === Role.CLIENT) return find('Privacy')
    if (onProfile)                   return find('Profile')
    if (chatOpen)                    return find('AI Adviser')
    return null
  }, [user, tabs, activePanel, privacyBarExpanded, onProfile, chatOpen])

  const isClient = user?.role === Role.CLIENT
  const privacyTabIndex = isClient && tabs ? tabs.findIndex(t => !('type' in t) && (t as { title: string }).title === 'Privacy') : -1
  const showPrivacyExpand = isClient && privacyTabIndex >= 0 && privacyBarExpanded

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
      <Link
        href={user ? (user.role === Role.ADVISER ? '/adviser' : `/client/${user.id}`) : '/'}
        className="flex items-center gap-2.5 group flex-shrink-0"
      >
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
          onChange={(index) => {
            if (index === null) setPrivacyBarExpanded(false)
          }}
          expandWhenIndex={showPrivacyExpand ? privacyTabIndex : undefined}
          expandContent={showPrivacyExpand ? (
            <div className="flex items-center gap-2 pl-1 pr-2 py-0.5">
              <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.7)' }}>Hide amounts from adviser</span>
              <button
                type="button"
                role="switch"
                aria-checked={privacyMode}
                onClick={async (e) => {
                  e.stopPropagation()
                  const next = !privacyMode
                  togglePrivacy()
                  if (isClient && user?.id) {
                    await supabase.from('profiles').update({ hide_amounts_from_adviser: next }).eq('id', user.id)
                  }
                }}
                className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#DFD0B8] focus:ring-offset-2 focus:ring-offset-[#0D0D0D]"
                style={{
                  background: privacyMode ? 'rgba(201,162,39,0.5)' : 'rgba(255,255,255,0.12)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              >
                <span
                  className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-all duration-200"
                  style={{
                    marginLeft: privacyMode ? '1rem' : '2px',
                    marginTop: '2px',
                  }}
                />
              </button>
            </div>
          ) : undefined}
        />
      ) : (
        <div />
      )}

      {/* ── Col 3: Right actions ── */}
      <div className="flex items-center gap-2 justify-end">
        {!isLoading && user && !onAuthPage && (
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
        )}
      </div>
    </motion.nav>
  )
}
