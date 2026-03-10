'use client'

import { motion } from 'framer-motion'
import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  animate?: boolean
  delay?: number
  hover?: boolean
  glow?: boolean
}

export default function GlassCard({
  children,
  className,
  animate = true,
  delay = 0,
  hover = true,
  glow = false,
}: GlassCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-30px' })

  const baseStyle: React.CSSProperties = {
    background: 'rgba(17,17,17,0.8)',
    backdropFilter: 'blur(16px) saturate(1.4)',
    border: glow ? '1px solid rgba(201,162,39,0.22)' : '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    boxShadow: glow ? '0 0 0 1px rgba(201,162,39,0.12), 0 0 32px rgba(201,162,39,0.08)' : undefined,
  }

  if (!animate) {
    return (
      <div ref={ref} className={cn('p-6', className)} style={baseStyle}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? {
        y: -2,
        borderColor: glow ? 'rgba(201,162,39,0.35)' : 'rgba(245,200,66,0.18)',
        transition: { duration: 0.2 },
      } : {}}
      className={cn('p-6', className)}
      style={baseStyle}
    >
      {children}
    </motion.div>
  )
}
