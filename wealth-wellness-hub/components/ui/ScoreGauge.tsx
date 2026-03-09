'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { getScoreColor } from '@/lib/utils'

interface ScoreGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
  showScore?: boolean
  className?: string
}

export default function ScoreGauge({
  score,
  size = 160,
  strokeWidth = 12,
  label,
  showScore = true,
  className = '',
}: ScoreGaugeProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const radius = (size - strokeWidth) / 2
  const circumference = radius * Math.PI // half circle arc
  const arcLength = (score / 100) * circumference
  const color = getScoreColor(score)

  return (
    <div ref={ref} className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Animated score arc */}
        <motion.path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset: circumference - arcLength } : {}}
          transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
        {showScore && (
          <>
            <text
              x={size / 2}
              y={size / 2 - 4}
              textAnchor="middle"
              fill="white"
              fontSize={size / 4}
              fontWeight="700"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {score}
            </text>
            {label && (
              <text
                x={size / 2}
                y={size / 2 + strokeWidth}
                textAnchor="middle"
                fill="rgba(255,255,255,0.5)"
                fontSize={size / 12}
                fontFamily="Inter, system-ui, sans-serif"
              >
                {label}
              </text>
            )}
          </>
        )}
      </svg>
    </div>
  )
}
