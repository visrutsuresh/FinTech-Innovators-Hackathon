'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const features = [
  { icon: '🏦', title: 'Unified Portfolio', desc: 'Stocks, crypto, cash & private assets in one view' },
  { icon: '🧮', title: 'Wellness Scoring', desc: 'HHI-based diversification, liquidity & behavioral alignment' },
  { icon: '🤖', title: 'AI Insights', desc: 'Claude-powered recommendations tailored to your profile' },
  { icon: '👨‍💼', title: 'Adviser Portal', desc: 'Manage all clients from a single powerful dashboard' },
]

const stats = [
  { label: 'Assets Tracked', value: '$1.02M+', desc: 'across 5 clients' },
  { label: 'Avg Wellness Score', value: '67/100', desc: 'across portfolio' },
  { label: 'AI Insights', value: 'Real-time', desc: 'powered by Claude' },
]

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen" style={{ background: '#0F0F1A' }}>
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: '600px',
            height: '600px',
            background: 'radial-gradient(circle, #F5C842 0%, transparent 70%)',
            top: '-200px',
            left: '-200px',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-15"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, #10B981 0%, transparent 70%)',
            bottom: '-100px',
            right: '-100px',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-10"
          style={{
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
            top: '40%',
            left: '60%',
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-medium"
            style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)', color: '#F5C842' }}>
            🏆 NTU FinTech Innovators Hackathon 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span style={{ color: '#F5C842' }}>Huat</span>
            <br />
            <span className="text-white/90">Wealth Wellness Hub</span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Unify your traditional and digital assets. Get AI-powered wellness scores
            and actionable recommendations — all in one intelligent hub.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/login"
              className="text-base px-8 py-4 rounded-xl font-bold transition-all hover:scale-105"
              style={{ background: '#F5C842', color: '#0F0F1A' }}
            >
              Login to Dashboard
            </Link>
            <Link
              href="/auth/signup"
              className="text-base px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'white', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Create Account
            </Link>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 text-xs text-white/30">
            Demo: adviser@demo.com / alex@demo.com (password: demo123)
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative px-6 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="text-center p-6 rounded-2xl"
              style={{ background: 'rgba(26,26,46,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: '#F5C842' }}>{stat.value}</div>
              <div className="text-sm font-medium text-white/80">{stat.label}</div>
              <div className="text-xs text-white/40 mt-0.5">{stat.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Everything You Need for Financial Wellness
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl"
                style={{
                  background: 'rgba(26,26,46,0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-base font-bold mb-2 text-white">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center p-12 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(245,200,66,0.1) 0%, rgba(16,185,129,0.05) 100%)',
            border: '1px solid rgba(245,200,66,0.2)',
          }}
        >
          <h2 className="text-3xl font-bold mb-4">Ready to <span style={{ color: '#F5C842' }}>Huat</span>?</h2>
          <p className="text-white/60 mb-8">Join the platform that keeps your wealth wellness on track.</p>
          <Link
            href="/auth/signup"
            className="inline-block text-base px-8 py-4 rounded-xl font-bold transition-all hover:scale-105"
            style={{ background: '#F5C842', color: '#0F0F1A' }}
          >
            Get Started Free
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
