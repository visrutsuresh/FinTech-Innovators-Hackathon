import { cn } from '@/lib/utils'

type BadgeVariant = 'gold' | 'emerald' | 'red' | 'gray' | 'orange' | 'blue'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  gold: { bg: 'rgba(245,200,66,0.15)', color: '#C9A227', border: 'rgba(245,200,66,0.3)' },
  emerald: { bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: 'rgba(16,185,129,0.3)' },
  red: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', border: 'rgba(239,68,68,0.3)' },
  gray: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'rgba(255,255,255,0.12)' },
  orange: { bg: 'rgba(249,115,22,0.15)', color: '#F97316', border: 'rgba(249,115,22,0.3)' },
  blue: { bg: 'rgba(59,130,246,0.15)', color: '#3B82F6', border: 'rgba(59,130,246,0.3)' },
}

export default function Badge({ children, variant = 'gray', className }: BadgeProps) {
  const style = variantStyles[variant]
  return (
    <span
      className={cn('inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full', className)}
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      {children}
    </span>
  )
}
