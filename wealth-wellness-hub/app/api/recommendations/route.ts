import { NextRequest, NextResponse } from 'next/server'
import { getRecommendations } from '@/lib/claude'
import type { RecommendationRequest } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body: RecommendationRequest = await req.json()
    const result = await getRecommendations(body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}
