import { RiskProfile } from '@/types'

export const ARCHETYPE: Record<string, string> = {
  [RiskProfile.CONSERVATIVE]: 'The Vault Guardian',
  [RiskProfile.MODERATE]:     'The Balanced Pathfinder',
  [RiskProfile.AGGRESSIVE]:   'The Quantum Maverick',
}

export function getArchetype(riskProfile?: string): string {
  return (riskProfile && ARCHETYPE[riskProfile]) || 'The Balanced Pathfinder'
}
