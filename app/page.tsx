'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const GOLD = '#C9A227'
const GOLD_DIM = 'rgba(201,162,39,0.12)'
const GOLD_BORDER = 'rgba(201,162,39,0.2)'

const pillars = [
  {
    label: 'Unified View',
    title: 'Every asset in one place',
    body: 'Stocks, crypto, cash, bonds and private equity — tracked together with live prices.',
    accent: '#C9A227',
  },
  {
    label: 'Wellness Score',
    title: 'Know your financial health',
    body: 'A composite score built from diversification, liquidity, and behavioural alignment.',
    accent: '#10B981',
  },
  {
    label: 'AI Insights',
    title: 'Personalised recommendations',
    body: 'Claude analyses your exact portfolio and surfaces actionable next steps.',
    accent: '#6366F1',
  },
]

const metrics = [
  { value: '$1.02M+', label: 'Assets under tracking' },
  { value: '5', label: 'Client profiles' },
  { value: 'Real-time', label: 'AI-powered insights' },
]

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0' }} />
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen" style={{ background: '#080808', color: '#fff' }}>
      {/* Ambient glow — very subtle */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: -300,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 600,
          background: 'radial-gradient(ellipse, rgba(201,162,39,0.07) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      {/* ── HERO ────────────────────────────────── */}
      <section
        className="relative pt-36 pb-28 px-6 text-center"
        style={{ zIndex: 1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-3xl mx-auto"
        >
          {/* Pill badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, color: GOLD }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: GOLD }}
            />
            NTU FinTech Innovators Hackathon 2026
          </div>

          <h1
            className="text-5xl sm:text-6xl font-black tracking-tight mb-5 leading-[1.05]"
            style={{ letterSpacing: '-0.02em' }}
          >
            <span style={{ color: GOLD }}>Wealth wellness</span>
            <br />
            <span className="text-white">for every asset you own.</span>
          </h1>

          <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            Huat unifies your stocks, crypto, cash and private assets, computes a
            real-time wellness score, and delivers Claude-powered recommendations.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/auth/login"
              className="text-sm font-bold px-7 py-3 rounded-xl transition-all hover:opacity-90 active:scale-95"
              style={{ background: GOLD, color: '#080808' }}
            >
              Sign in to dashboard
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-medium px-7 py-3 rounded-xl transition-all hover:border-white/20"
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Create account
            </Link>
          </div>
        </motion.div>
      </section>

      <Divider />

      {/* ── METRICS STRIP ───────────────────────── */}
      <section className="relative py-10 px-6" style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-0 divide-x divide-white/5">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="text-center px-6 py-2"
            >
              <p className="text-xl font-bold text-white mb-0.5">{m.value}</p>
              <p className="text-xs text-white/35">{m.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── PILLARS ─────────────────────────────── */}
      <section className="relative px-6 py-24" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">
              Core capabilities
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Built for serious wealth management
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px"
            style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            {pillars.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8"
                style={{ background: '#0E0E0E' }}
              >
                <div
                  className="text-xs font-semibold uppercase tracking-widest mb-5 inline-block px-2.5 py-1 rounded-full"
                  style={{
                    background: `${p.accent}15`,
                    color: p.accent,
                    border: `1px solid ${p.accent}30`,
                  }}
                >
                  {p.label}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── CTA ─────────────────────────────────── */}
      <section className="relative px-6 py-24" style={{ zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-3 tracking-tight">
            Ready to <span style={{ color: GOLD }}>Huat</span>?
          </h2>
          <p className="text-white/45 text-sm mb-8">
            Sign in with a demo account and explore the full platform in under a minute.
          </p>
          <Link
            href="/auth/login"
            className="inline-block text-sm font-bold px-8 py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{ background: GOLD, color: '#080808' }}
          >
            Try the demo
          </Link>
        </motion.div>
      </section>

      {/* Footer line */}
      <Divider />
      <div className="py-5 text-center text-xs text-white/20">
        © 2026 Huat — NTU FinTech Innovators Hackathon
      </div>
    </div>
  )
}
