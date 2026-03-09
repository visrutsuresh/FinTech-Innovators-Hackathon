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
    {
      title: 'Explore Growth Opportunities',
      description: 'Consider rebalancing into higher-growth assets appropriate for your risk profile.',
      priority: 'low',
      category: 'opportunity',
    },
  ],
  summary: 'Your portfolio requires attention in several key areas to optimise financial wellness.',
  marketContext: 'Current market conditions emphasise the importance of diversification and maintaining liquidity buffers.',
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

  const systemPrompt = `You are a helpful AI adviser embedded in Huat, a wealth management platform. You have full context of this client's portfolio and can answer ANY question — financial or otherwise.

Client Risk Profile: ${req.riskProfile}
Total Portfolio Value: $${req.portfolio.totalValue.toLocaleString()}
Wellness Score: ${req.wellnessScore.overall}/100 (${req.wellnessScore.label})
  - Diversification: ${req.wellnessScore.diversification}/100
  - Liquidity: ${req.wellnessScore.liquidity}/100
  - Behavioural Alignment: ${req.wellnessScore.behavioral}/100

Portfolio Breakdown:
${JSON.stringify(portfolioSummary, null, 2)}

Always respond with ONLY valid JSON (no markdown, no code blocks). Choose the format based on what the user is asking:

If the user asks about their portfolio, investments, risk, recommendations, financial analysis, or anything wealth-related:
{
  "type": "recommendations",
  "recommendations": [{ "title": "string", "description": "string (2-3 sentences)", "priority": "high"|"medium"|"low", "category": "diversification"|"liquidity"|"risk"|"opportunity" }],
  "summary": "string (1-2 sentences)",
  "marketContext": "string (1-2 sentences)"
}

For ALL other questions (maths, general knowledge, casual chat, anything non-financial):
{
  "type": "chat",
  "message": "your answer here"
}

Use your judgement. Answer the user's actual question accurately.`

  // Build multi-turn messages: all prior conversation + new user message
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...(req.conversationHistory ?? []),
    {
      role: 'user',
      content: req.scenario || 'Give me recommendations based on my portfolio',
    },
  ]

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    // Strip any accidental markdown fences before parsing
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const parsed = JSON.parse(cleaned) as RecommendationResponse
    // Normalise: ensure arrays exist even for chat responses
    return {
      type: parsed.type ?? 'recommendations',
      message: parsed.message ?? '',
      recommendations: parsed.recommendations ?? [],
      summary: parsed.summary ?? '',
      marketContext: parsed.marketContext ?? '',
    }
  } catch (error) {
    console.error('Claude API error:', error)
    return FALLBACK_RECOMMENDATIONS
  }
}
