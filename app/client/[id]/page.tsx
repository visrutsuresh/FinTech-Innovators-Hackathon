import { notFound } from 'next/navigation'
import { getClientById } from '@/lib/db'
import { calculateWellnessScore } from '@/lib/wellness'
import ClientView from './ClientView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params
  const client = await getClientById(id)
  if (!client) notFound()

  // Render dashboard immediately with DB data; ClientView fetches live prices on mount
  // (crypto/stocks APIs are deferred to avoid blocking initial render)
  const wellnessScore = calculateWellnessScore(client.portfolio, client.riskProfile)

  return (
    <ClientView
      client={client}
      wellnessScore={wellnessScore}
    />
  )
}
