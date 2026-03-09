'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth, Role } from './AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{ background: 'rgba(15,15,26,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <Link href="/" className="flex items-center gap-2">
        <span className="text-2xl font-bold" style={{ color: '#F5C842' }}>
          Huat 🤑
        </span>
        <span className="text-xs text-white/40 hidden sm:block">Wealth Wellness Hub</span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-white/60 hidden sm:block">
              {user.name}
            </span>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: user.role === Role.ADVISER ? 'rgba(245,200,66,0.15)' : 'rgba(16,185,129,0.15)',
                color: user.role === Role.ADVISER ? '#F5C842' : '#10B981',
                border: `1px solid ${user.role === Role.ADVISER ? 'rgba(245,200,66,0.3)' : 'rgba(16,185,129,0.3)'}`,
              }}
            >
              {user.role === Role.ADVISER ? 'Adviser' : 'Client'}
            </span>
            {user.role === Role.ADVISER && (
              <Link
                href="/adviser"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
              style={{ background: '#F5C842', color: '#0F0F1A' }}
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  )
}
