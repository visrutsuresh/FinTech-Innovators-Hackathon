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
  const circumference = radius * Math.PI // half-circle arc
  const arcLength = (score / 100) * circumference
  const color = getScoreColor(score)

  // Arc tip position (end of the score arc)
  const angle = (score / 100) * Math.PI // from 0 to π
  const tipX = size / 2 + radius * Math.cos(Math.PI - angle)
  const tipY = size / 2 - radius * Math.sin(Math.PI - angle)

  return (
    <div ref={ref} className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
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
            transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
          {/* Pulsing glow dot at arc tip */}
          {isInView && score > 2 && (
            <motion.circle
              cx={tipX}
              cy={tipY}
              r={strokeWidth / 2}
              fill={color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0.6, 1, 0.6], scale: [0.8, 1.1, 0.8] }}
              transition={{
                opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 },
                scale: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 },
              }}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
          )}
          {showScore && (
            <>
              <text
                x={size / 2}
                y={size / 2 - 6}
                textAnchor="middle"
                fill="white"
                fontSize={size / 4.2}
                fontWeight="800"
                fontFamily="Inter, system-ui, sans-serif"
                letterSpacing="-0.03em"
              >
                {score}
              </text>
              {label && (
                <text
                  x={size / 2}
                  y={size / 2 + strokeWidth + 2}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.4)"
                  fontSize={size / 13}
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {label}
                </text>
              )}
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
