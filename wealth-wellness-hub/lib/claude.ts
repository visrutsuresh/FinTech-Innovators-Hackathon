import Anthropic from '@anthropic-ai/sdk'
import type { RecommendationRequest, RecommendationResponse } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const FALLBACK_RECOMMENDATIONS: RecommendationResponse = {
  recommendations: [
    {
      title: 'Review Portfolio Diversification',
      description: 'Consider spreading assets across multiple asset classes to reduce concentration risk.',
      priority: 'high',
      category: 'diversification',
    },
    {
      title: 'Maintain Emergency Liquidity',
      description: 'Ensure at least 3-6 months of expenses are held in liquid assets.',
      priority: 'high',
      category: 'liquidity',
    },
    {
      title: 'Align Risk with Profile',
      description: 'Review whether current asset allocation matches your stated risk tolerance.',
      priority: 'medium',
      category: 'risk',
    },
  ],
  summary: 'Your portfolio requires attention in several key areas to optimize financial wellness.',
  marketContext: 'Current market conditions emphasize the importance of diversification and maintaining liquidity buffers.',
}

export async function getRecommendations(
  req: RecommendationRequest
): Promise<RecommendationResponse> {
  const portfolioSummary = req.portfolio.assets.map(a => ({
    name: a.name,
    class: a.assetClass,
    value: a.value,
    percentage: ((a.value / req.portfolio.totalValue) * 100).toFixed(1) + '%',
  }))

  const prompt = `You are a professional wealth management adviser. Analyze this client portfolio and provide actionable recommendations.

Client Risk Profile: ${req.riskProfile}
Total Portfolio Value: $${req.portfolio.totalValue.toLocaleString()}
Wellness Score: ${req.wellnessScore.overall}/100 (${req.wellnessScore.label})
- Diversification: ${req.wellnessScore.diversification}/100
- Liquidity: ${req.wellnessScore.liquidity}/100
- Behavioral Alignment: ${req.wellnessScore.behavioral}/100

Portfolio Breakdown:
${JSON.stringify(portfolioSummary, null, 2)}

${req.scenario ? `Client's specific scenario/question: ${req.scenario}` : ''}

Respond with ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "recommendations": [
    {
      "title": "string",
      "description": "string (2-3 sentences)",
      "priority": "high" | "medium" | "low",
      "category": "diversification" | "liquidity" | "risk" | "opportunity"
    }
  ],
  "summary": "string (1-2 sentences overall assessment)",
  "marketContext": "string (1-2 sentences about current market context)"
}

Provide 3-4 specific, actionable recommendations tailored to this exact portfolio.`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text) as RecommendationResponse
    return parsed
  } catch (error) {
    console.error('Claude API error:', error)
    return FALLBACK_RECOMMENDATIONS
  }
}
