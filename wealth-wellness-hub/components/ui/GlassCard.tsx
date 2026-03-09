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
}

export default function GlassCard({ children, className, animate = true, delay = 0, hover = true }: GlassCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-30px' })

  const baseStyle = {
    background: 'rgba(26,26,46,0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
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
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={hover ? { y: -2, borderColor: 'rgba(245,200,66,0.2)' } : {}}
      className={cn('p-6', className)}
      style={baseStyle}
    >
      {children}
    </motion.div>
  )
}
