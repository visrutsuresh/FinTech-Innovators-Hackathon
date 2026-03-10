'use client'

import { useRouter } from 'next/navigation'
import { motion, animate, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/components/layout/AuthContext'

import AnimatedCounter from '@/components/ui/AnimatedCounter'
import { GlowingEffect } from '@/components/ui/glowing-effect'

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:    '#0D0D0D',   // black — page background
  deep:  '#1A1E24',   // card / surface
  mid:   '#948979',   // taupe — secondary text, borders, dividers
  light: '#DFD0B8',   // cream — primary accent, highlights, interactive
  white: '#FFFFFF',   // primary text
  // derived
  deepA:  (a: number) => `rgba(26,30,36,${a})`,
  midA:   (a: number) => `rgba(148,137,121,${a})`,
  lightA: (a: number) => `rgba(223,208,184,${a})`,
}

// ── Easing ───────────────────────────────────────────────────────────────────
const E: [number, number, number, number] = [0.22, 1, 0.36, 1]
const SPRING = { type: 'spring' as const, stiffness: 280, damping: 28 }

// ── Data ─────────────────────────────────────────────────────────────────────
const pillars = [
  {
    label: 'Unified View',
    title: 'Every asset in one place',
    body: 'Stocks, crypto, cash, bonds and private equity — tracked together with live prices.',
    accent: C.light,
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3zm0 11h7v7H3zm11-11h7v7h-7zm0 11h7v7h-7z" />
      </svg>
    ),
  },
  {
    label: 'Wellness Score',
    title: 'Know your financial health',
    body: 'A composite score from diversification, liquidity, and behavioural alignment.',
    accent: C.mid,
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'AI Insights',
    title: 'Personalised recommendations',
    body: 'Claude AI analyses your portfolio and surfaces actionable next steps.',
    accent: C.deep,
    accentBright: C.light,
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
]

const metrics = [
  { value: 1.02, prefix: '$', suffix: 'M+', label: 'Assets under tracking', decimals: 2 },
  { value: 5,    prefix: '',  suffix: '',   label: 'Client profiles',        decimals: 0 },
  { value: 99.9, prefix: '',  suffix: '%',  label: 'AI insight accuracy',    decimals: 1 },
]

const LEFT_NODES  = [
  { label: 'AAPL',   value: '$142.5',  delay: 0.85 },
  { label: 'BTC',    value: '2.4 BTC', delay: 1.05 },
]
const RIGHT_NODES = [
  { label: 'META',   value: '$310.2',  delay: 0.90 },
  { label: 'Realty', value: 'S$850K',  delay: 1.10 },
]
const BAR_H = [32, 56, 78, 44, 92, 36, 64, 50]
const ASSET_CLASSES = ['Stocks', 'Crypto', 'Real Estate', 'Bonds', 'Cash', 'Private Equity']


// ── Magnetic button hook ──────────────────────────────────────────────────────
function useMagnetic(strength = 0.3) {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 400, damping: 30 })
  const sy = useSpring(y, { stiffness: 400, damping: 30 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    x.set((e.clientX - cx) * strength)
    y.set((e.clientY - cy) * strength)
  }, [x, y, strength])

  const reset = useCallback(() => { x.set(0); y.set(0) }, [x, y])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', reset)
    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', reset)
    }
  }, [handleMouseMove, reset])

  return { ref, sx, sy }
}

// ── Floating node component ──────────────────────────────────────────────────
function FloatNode({
  node, side, top, delay,
}: {
  node: { label: string; value: string; delay: number }
  side: 'left' | 'right'
  top: string
  delay: number
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -28 : 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.7, ease: E }}
      className="absolute z-20 flex items-center"
      style={{
        top,
        [side]: 24,
        flexDirection: side === 'right' ? 'row-reverse' : 'row',
        gap: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pulsing circle */}
      <motion.div
        animate={{ scale: hovered ? 1.15 : 1, boxShadow: hovered ? `0 0 20px ${C.midA(0.5)}` : `0 0 0px transparent` }}
        transition={SPRING}
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative"
        style={{
          background: C.deepA(0.8),
          border: `1px solid ${C.midA(0.35)}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Pulse ring */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{ border: `1px solid ${C.midA(0.4)}` }}
            />
          )}
        </AnimatePresence>
        <span className="text-[10px] font-bold" style={{ color: C.light }}>
          {node.label.slice(0, 2)}
        </span>
      </motion.div>

      {/* Connecting line */}
      <motion.div
        animate={{ scaleX: hovered ? 1.1 : 1, opacity: hovered ? 0.35 : 0.15 }}
        transition={{ duration: 0.3 }}
        style={{
          width: 64,
          height: 1,
          background: side === 'left'
            ? `linear-gradient(90deg, ${C.midA(0.6)}, transparent)`
            : `linear-gradient(270deg, ${C.midA(0.6)}, transparent)`,
          transformOrigin: side === 'left' ? 'left' : 'right',
          flexShrink: 0,
        }}
      />

      {/* Label */}
      <div style={{ [side === 'left' ? 'marginLeft' : 'marginRight']: 0 }}>
        <motion.p
          animate={{ color: hovered ? C.light : C.lightA(0.5) }}
          transition={{ duration: 0.2 }}
          className="text-[11px] font-semibold leading-tight"
        >
          {side === 'right' ? `${node.label} ·` : `· ${node.label}`}
        </motion.p>
        <p className="text-[10px] tabular-nums leading-tight" style={{ color: C.midA(0.5) }}>
          {node.value}
        </p>
      </div>
    </motion.div>
  )
}

// ── Pillar card ──────────────────────────────────────────────────────────────
function PillarCard({ p, i }: { p: typeof pillars[0] & { accentBright?: string }; i: number }) {
  const [hovered, setHovered] = useState(false)
  const accent = p.accentBright ?? p.accent

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: i * 0.14, duration: 0.65, ease: E }}
      whileHover={{ y: -6 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative p-7 rounded-2xl cursor-default"
      style={{
        background: `linear-gradient(145deg, ${C.deepA(0.85)} 0%, rgba(13,13,13,0.95) 100%)`,
        border: `1px solid ${hovered ? C.midA(0.4) : C.deepA(0.6)}`,
        boxShadow: hovered ? `0 0 48px ${C.midA(0.18)}, 0 20px 60px rgba(13,13,13,0.6)` : '0 4px 24px rgba(13,13,13,0.4)',
        transition: 'border-color 0.35s ease, box-shadow 0.35s ease',
      }}
    >
      <GlowingEffect spread={40} glow={false} disabled={false} proximity={80} inactiveZone={0.1} borderWidth={2} />
      {/* Top glow line */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0, scaleX: hovered ? 1 : 0.3 }}
        transition={{ duration: 0.4 }}
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />

      {/* Background ambient glow on hover */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 30% 30%, ${C.deepA(0.4)} 0%, transparent 65%)`,
          borderRadius: 16,
        }}
      />

      <motion.div
        animate={{ scale: hovered ? 1.05 : 1, boxShadow: hovered ? `0 0 24px ${C.midA(0.3)}` : '0 0 0px transparent' }}
        transition={SPRING}
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 relative z-10"
        style={{
          background: `linear-gradient(135deg, ${C.deepA(0.9)} 0%, ${C.deepA(0.6)} 100%)`,
          color: accent,
          border: `1px solid ${C.midA(0.25)}`,
        }}
      >
        {p.icon}
      </motion.div>

      <div
        className="text-[9px] font-semibold uppercase tracking-[0.16em] mb-3 inline-block px-2.5 py-1 rounded-full relative z-10"
        style={{
          background: C.deepA(0.8),
          color: accent,
          border: `1px solid ${C.midA(0.2)}`,
        }}
      >
        {p.label}
      </div>
      <h3
        className="text-sm font-bold mb-2 relative z-10"
        style={{ color: C.white, letterSpacing: '-0.01em' }}
      >
        {p.title}
      </h3>
      <p className="text-sm leading-relaxed relative z-10" style={{ color: C.midA(0.65) }}>
        {p.body}
      </p>
    </motion.div>
  )
}

// ── Swing keyframes: 70-sample damped sine, x offset from natural position ────
// Buttons stay in-flow the entire time — only their CSS transform is animated.
// x starts at ±600 (off-screen), ends at 0 (natural position). No layout jump.
function buildSwingFrames(n = 70) {
  const xs: number[] = [], y1s: number[] = [], x2s: number[] = [], y2s: number[] = [], ts: number[] = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const et = t * t * t * (t * (t * 6 - 15) + 10) // smoothstep — decelerates naturally
    const decay = Math.pow(1 - t, 1.5)
    const wave  = Math.sin(2 * Math.PI * 2.5 * t) * 70 * decay
    xs.push(600 * (1 - et))    // +600 → 0  (Sign in enters from right)
    y1s.push(wave)
    x2s.push(-600 * (1 - et))  // -600 → 0  (Get started enters from left)
    y2s.push(-wave)             // mirror phase
    ts.push(t)
  }
  return { xs, y1s, x2s, y2s, ts }
}
const SWING = buildSwingFrames()

// ── Animated CTA ─────────────────────────────────────────────────────────────
function AnimatedCTA({ mounted }: { mounted: boolean }) {
  const [animDone, setAnimDone] = useState(false)
  const mag1 = useMagnetic(0.25)
  const mag2 = useMagnetic(0.25)

  // x/y offsets from the buttons' natural in-flow position.
  // End at 0 → land exactly where the flex layout placed them.
  const ax1 = useMotionValue(600),  ay1 = useMotionValue(0)
  const ax2 = useMotionValue(-600), ay2 = useMotionValue(0)

  useEffect(() => {
    if (!mounted) return
    const opts = { duration: 2.6, ease: 'linear' as const, times: SWING.ts }
    const run = async () => {
      await new Promise(r => setTimeout(r, 150))
      await Promise.all([
        animate(ax1, SWING.xs,  opts),
        animate(ay1, SWING.y1s, opts),
        animate(ax2, SWING.x2s, { ...opts, delay: 0.13 }),
        animate(ay2, SWING.y2s, { ...opts, delay: 0.13 }),
      ])
      setAnimDone(true)
    }
    run()
  }, [mounted, ax1, ay1, ax2, ay2])

  // After animation ends, combine magnetic pull with the (now-zero) anim offset
  const cx1 = useTransform([ax1, mag1.sx] as const, ([a, m]: number[]) => a + m)
  const cy1 = useTransform([ay1, mag1.sy] as const, ([a, m]: number[]) => a + m)
  const cx2 = useTransform([ax2, mag2.sx] as const, ([a, m]: number[]) => a + m)
  const cy2 = useTransform([ay2, mag2.sy] as const, ([a, m]: number[]) => a + m)

  return (
    <motion.div
      className="flex items-center gap-3"
      animate={animDone ? { y: [0, -6, 0] } : {}}
      transition={animDone ? { y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 } } : {}}
    >
      {/* Sign in */}
      <div className="relative rounded-full">
        {animDone && <GlowingEffect spread={20} glow={false} disabled={false} proximity={50} inactiveZone={0.01} borderWidth={1} />}
        <motion.a
          ref={mag1.ref}
          href="/auth/login"
          whileHover={animDone ? { color: C.white } : {}}
          whileTap={animDone ? { scale: 0.97 } : {}}
          className="relative text-base font-semibold px-10 py-4 rounded-full inline-block"
          style={{
            x: cx1, y: cy1,
            color: C.midA(0.7),
            border: `1px solid ${C.midA(0.3)}`,
            textDecoration: 'none',
            pointerEvents: animDone ? 'auto' : 'none',
          }}
        >
          Sign in
        </motion.a>
      </div>

      {/* Get started */}
      <div className="relative rounded-full">
        {animDone && <GlowingEffect spread={20} glow={false} disabled={false} proximity={50} inactiveZone={0.01} borderWidth={1} />}
        <motion.a
          ref={mag2.ref}
          href="/auth/signup"
          whileHover={animDone ? { scale: 1.03, boxShadow: `0 0 24px ${C.lightA(0.2)}` } : {}}
          whileTap={animDone ? { scale: 0.96 } : {}}
          className="relative text-base font-semibold px-10 py-4 rounded-full inline-block"
          style={{
            x: cx2, y: cy2,
            background: C.light,
            color: C.bg,
            textDecoration: 'none',
            pointerEvents: animDone ? 'auto' : 'none',
          }}
        >
          Get started
        </motion.a>
      </div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  // Scroll parallax
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroContentY = useTransform(heroScroll, [0, 1], [0, 50])
  const heroBlobY    = useTransform(heroScroll, [0, 1], [0, -30])
  const heroOpacity  = useTransform(heroScroll, [0, 0.8], [1, 0.6])

  // Cursor-tracking glow for hero
  const cursorX = useMotionValue(0.5)
  const cursorY = useMotionValue(0.5)
  const smoothX = useSpring(cursorX, { stiffness: 60, damping: 20 })
  const smoothY = useSpring(cursorY, { stiffness: 60, damping: 20 })

  useEffect(() => {
    setMounted(true)
    if (user) {
      router.replace(user.role === 'adviser' ? '/adviser' : `/client/${user.id}`)
    }
  }, [user, router])


  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    cursorX.set((e.clientX - r.left) / r.width)
    cursorY.set((e.clientY - r.top) / r.height)
  }, [cursorX, cursorY])

  return (
    <div ref={pageRef} style={{ background: C.bg, color: '#fff', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-3 sm:px-4 pt-[68px]" ref={heroRef}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.99 }}
          animate={mounted ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.9, ease: E }}
          onMouseMove={handleHeroMouseMove}
          className="relative mx-auto overflow-hidden"
          style={{
            maxWidth: 1300,
            height: '90vh',
            minHeight: 660,
            borderRadius: 24,
            background: `linear-gradient(160deg, ${C.deepA(0.7)} 0%, rgba(13,13,13,0.97) 55%, ${C.bg} 100%)`,
            border: `1px solid ${C.deepA(0.8)}`,
            boxShadow: `0 0 0 1px ${C.midA(0.12)}, 0 32px 80px rgba(13,13,13,0.7)`,
          }}
        >
          {/* ── Cursor-tracking ambient glow ── */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: useTransform(smoothX, v => `${v * 100}%`),
              top:  useTransform(smoothY, v => `${v * 100}%`),
              translateX: '-50%',
              translateY: '-50%',
              width: 480,
              height: 480,
              background: `radial-gradient(circle, ${C.deepA(0.35)} 0%, transparent 65%)`,
              filter: 'blur(20px)',
              borderRadius: '50%',
            }}
          />

          {/* ── Primary glow blob — upper right ── */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              y: heroBlobY,
              top: '-18%',
              right: '-6%',
              width: '58%',
              height: '80%',
              background: `radial-gradient(ellipse 55% 60% at 70% 28%,
                ${C.deepA(0.9)} 0%,
                ${C.midA(0.18)} 35%,
                ${C.lightA(0.06)} 55%,
                transparent 72%)`,
              filter: 'blur(1px)',
            }}
          />

          {/* ── Subtle teal shimmer lines ── */}
          {mounted && [0.28, 0.52, 0.74].map((pos, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 1.2 + i * 0.2, duration: 1.2, ease: E }}
              className="absolute pointer-events-none"
              style={{
                top: `${pos * 100}%`,
                left: 0,
                right: 0,
                height: 1,
                background: `linear-gradient(90deg, transparent 5%, ${C.midA(0.08)} 30%, ${C.lightA(0.12)} 50%, ${C.midA(0.08)} 70%, transparent 95%)`,
                transformOrigin: 'left',
              }}
            />
          ))}


          {/* ── LEFT NODES ── */}
          {mounted && LEFT_NODES.map((n, i) => (
            <FloatNode
              key={n.label} node={n} side="left"
              top={i === 0 ? '32%' : '57%'}
              delay={n.delay}
            />
          ))}

          {/* ── RIGHT NODES ── */}
          {mounted && RIGHT_NODES.map((n, i) => (
            <FloatNode
              key={n.label} node={n} side="right"
              top={i === 0 ? '30%' : '57%'}
              delay={n.delay}
            />
          ))}

          {/* ── CENTER CONTENT ── */}
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center"
            style={{ y: heroContentY, opacity: heroOpacity, padding: '0 clamp(48px, 8%, 140px)' }}
          >

            {/* Headline — staggered words */}
            <motion.div
              initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
              animate={mounted ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ delay: 0.4, duration: 0.8, ease: E }}
              className="mb-5"
            >
              <h1
                style={{
                  fontSize: 'clamp(2.8rem, 6.5vw, 6rem)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  letterSpacing: '-0.022em',
                }}
              >
                <span style={{ color: C.white, display: 'block' }}>Wealth wellness</span>
                <span style={{ color: C.lightA(0.45), display: 'block' }}>for every asset you own.</span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.52em',
                    fontWeight: 400,
                    marginTop: '0.4em',
                    color: C.midA(0.55),
                    letterSpacing: '-0.01em',
                  }}
                >
                  Powered by{' '}
                  <span
                    className="font-ballet"
                    style={{
                      color: C.light,
                      fontSize: '1.65em',
                      lineHeight: 0.85,
                      display: 'inline-block',
                      verticalAlign: 'middle',
                      filter: `drop-shadow(0 0 20px rgba(223,208,184,0.4))`,
                    }}
                  >
                    Huat
                  </span>
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.56, duration: 0.55, ease: E }}
              className="text-sm leading-relaxed mx-auto mb-9"
              style={{ color: C.midA(0.55) }}
            >
              Unified portfolio tracking, real‑time wellness scoring, and Claude‑powered AI recommendations.
            </motion.p>

            {/* CTA Buttons */}
            <AnimatedCTA mounted={mounted} />
          </motion.div>

          {/* ── BAR CHART — bottom center ── */}
          {mounted && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 flex items-end gap-[3px]"
            >
              {BAR_H.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: h }}
                  transition={{ delay: 1.2 + i * 0.06, duration: 0.55, ease: E }}
                  style={{
                    width: 3,
                    background: i === 4
                      ? `linear-gradient(to top, ${C.mid}, ${C.lightA(0.4)})`
                      : `linear-gradient(to top, ${C.deepA(0.8)}, ${C.midA(0.15)})`,
                    borderRadius: '2px 2px 0 0',
                    flexShrink: 0,
                  }}
                />
              ))}
            </motion.div>
          )}


        </motion.div>

        {/* ── ASSET CLASS STRIP ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.85, duration: 0.6, ease: E }}
          className="max-w-[1300px] mx-auto mt-4 flex items-center justify-center overflow-hidden"
          style={{
            borderRadius: 14,
            border: `1px solid ${C.deepA(0.7)}`,
            background: C.deepA(0.25),
          }}
        >
          {ASSET_CLASSES.map((cls, i) => (
            <motion.div
              key={cls}
              whileHover={{ color: C.light, background: C.deepA(0.5) }}
              transition={{ duration: 0.2 }}
              className="flex items-center px-6 py-3 cursor-default"
              style={{
                color: C.midA(0.4),
                borderRight: i < ASSET_CLASSES.length - 1 ? `1px solid ${C.deepA(0.8)}` : 'none',
                fontSize: 11,
                letterSpacing: '0.07em',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {cls}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          METRICS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: E }}
          style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.midA(0.25)}, transparent)`, transformOrigin: 'left' }}
        />
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-0 pt-16 pb-12">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.13, duration: 0.6, ease: E }}
              whileHover={{ scale: 1.04 }}
              className="text-center px-8 py-2 cursor-default"
              style={{ borderRight: i < metrics.length - 1 ? `1px solid ${C.deepA(0.7)}` : 'none' }}
            >
              <motion.p
                className="text-3xl font-bold tabular-nums mb-1.5"
                style={{ color: C.light, letterSpacing: '-0.03em' }}
                whileHover={{ textShadow: `0 0 20px ${C.lightA(0.4)}` }}
              >
                {m.prefix}
                <AnimatedCounter value={m.value} decimals={m.decimals} duration={1200} />
                {m.suffix}
              </motion.p>
              <p className="text-xs tracking-wide" style={{ color: C.midA(0.45) }}>{m.label}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: E, delay: 0.2 }}
          style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.deepA(0.8)}, transparent)`, transformOrigin: 'right' }}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PILLARS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative px-6 py-20">
        {/* Section ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${C.deepA(0.35)} 0%, transparent 65%)`,
          }}
        />

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: E }}
            className="mb-16 text-center"
          >
            <motion.p
              className="text-[10px] font-semibold uppercase tracking-[0.22em] mb-4"
              style={{ color: C.midA(0.45) }}
            >
              Core capabilities
            </motion.p>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ letterSpacing: '-0.028em', color: C.white }}>
              Built for serious wealth management
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pillars.map((p, i) => <PillarCard key={p.label} p={p} i={i} />)}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative px-6 py-28 overflow-hidden">
        {/* Animated ambient ring */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
          style={{
            width: 500,
            height: 500,
            border: `1px solid ${C.midA(0.12)}`,
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.18, 0.1] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut', delay: 1 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
          style={{
            width: 340,
            height: 340,
            border: `1px solid ${C.midA(0.18)}`,
            background: `radial-gradient(circle, ${C.deepA(0.3)} 0%, transparent 65%)`,
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: E }}
          className="max-w-lg mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-7"
            style={{
              background: C.deepA(0.6),
              border: `1px solid ${C.midA(0.25)}`,
              color: C.light,
            }}
          >
            Free demo · No sign-up required
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6, ease: E }}
            className="text-3xl sm:text-4xl font-bold mb-5"
            style={{ letterSpacing: '-0.028em' }}
          >
            Ready to{' '}
            <span
              className="font-ballet"
              style={{
                color: C.light,
                fontSize: '1.18em',
                display: 'inline-block',
                verticalAlign: 'middle',
                lineHeight: 0.88,
                filter: `drop-shadow(0 0 18px rgba(223,208,184,0.35))`,
              }}
            >
              Huat
            </span>
            ?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="text-sm mb-10"
            style={{ color: C.midA(0.5) }}
          >
            Sign in with a demo account and explore the full platform in under a minute.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="relative inline-flex rounded-full">
              <GlowingEffect spread={30} glow={false} disabled={false} proximity={60} inactiveZone={0.01} borderWidth={2} />
              <motion.a
                href="/auth/login"
                whileHover={{
                  scale: 1.04,
                  boxShadow: `0 0 48px ${C.midA(0.45)}, 0 0 80px ${C.deepA(0.5)}`,
                }}
                whileTap={{ scale: 0.97 }}
                className="relative inline-flex items-center gap-2.5 text-sm font-bold px-8 py-3.5 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${C.mid} 0%, ${C.deep} 100%)`,
                  color: '#fff',
                  boxShadow: `0 0 28px ${C.midA(0.25)}`,
                  textDecoration: 'none',
                }}
              >
                Try the demo
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.0, ease: E }}
        style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.deepA(0.7)}, transparent)` }}
      />
      <div className="py-6 text-center" style={{ color: C.midA(0.3), fontSize: 11, letterSpacing: '0.05em' }}>
        © 2026 Huat — Wealth Wellness Platform · NTU FinTech Innovators Hackathon
      </div>
    </div>
  )
}
