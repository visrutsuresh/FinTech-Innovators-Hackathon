'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RecommendationResponse, Portfolio, WellnessScore, RiskProfile, ConversationMessage } from '@/types'
import { supabase } from '@/lib/supabase'

interface AIRecommendationsProps {
  clientId: string
  portfolio: Portfolio
  wellnessScore: WellnessScore
  riskProfile: RiskProfile
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  response?: RecommendationResponse
  timestamp: number
}

const PRIORITY_COLOR: Record<string, string> = {
  high: '#EF4444',
  medium: '#C9A227',
  low: '#6B7280',
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  diversification: (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
    </svg>
  ),
  liquidity: (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3" />
    </svg>
  ),
  risk: (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  opportunity: (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
}

const QUICK_PROMPT = 'Give me recommendations based on my portfolio'

export default function AIRecommendations({
  clientId, portfolio, wellnessScore, riskProfile,
}: AIRecommendationsProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat history from Supabase on mount
  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })

      if (data && data.length > 0) {
        setMessages(
          data.map((row) => ({
            id: row.id as string,
            role: row.role as 'user' | 'assistant',
            text: row.content as string,
            response: row.response ?? undefined,
            timestamp: new Date(row.created_at as string).getTime(),
          }))
        )
      }
      setHistoryLoaded(true)
    }
    loadHistory()
  }, [clientId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Build conversation history array for Claude (all messages so far)
  const buildConversationHistory = (msgs: ChatMessage[]): ConversationMessage[] =>
    msgs.map((m) => ({
      role: m.role,
      content:
        m.role === 'assistant' && m.response
          ? JSON.stringify(m.response)
          : m.text,
    }))

  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim()
      if (!text || loading) return

      setInput('')

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      // Persist user message to Supabase
      await supabase.from('chat_messages').insert({
        client_id: clientId,
        role: 'user',
        content: text,
      })

      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            portfolio,
            wellnessScore,
            riskProfile,
            scenario: text,
            conversationHistory: buildConversationHistory(messages),
          }),
        })
        const data: RecommendationResponse = await res.json()
        const isChat = data.type === 'chat'

        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: isChat ? (data.message || '') : data.summary,
          response: isChat ? undefined : data,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, assistantMsg])

        // Persist assistant message to Supabase
        await supabase.from('chat_messages').insert({
          client_id: clientId,
          role: 'assistant',
          content: isChat ? (data.message || '') : data.summary,
          response: isChat ? null : data,
        })
      } catch {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Something went wrong. Please try again.',
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        setLoading(false)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, loading, clientId, portfolio, wellnessScore, riskProfile, messages]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = async () => {
    setMessages([])
    await supabase.from('chat_messages').delete().eq('client_id', clientId)
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '380px' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(201,162,39,0.12)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#C9A227" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Adviser</p>
            <p className="text-xs text-white/30">AI-powered — ask anything</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-white/20 hover:text-white/50 transition-colors"
            title="Clear conversation"
          >
            Clear
          </button>
        )}
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-1"
        style={{ maxHeight: '340px', scrollbarWidth: 'thin' }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div
                  className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-xs text-white"
                  style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.2)' }}
                >
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-[95%] space-y-2">
                  {/* Summary */}
                  <div
                    className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-xs text-white/65 leading-relaxed"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {msg.text}
                  </div>

                  {/* Recommendation cards */}
                  {msg.response?.recommendations?.map((rec, i) => {
                    const pColor = PRIORITY_COLOR[rec.priority] ?? '#6B7280'
                    return (
                      <div
                        key={i}
                        className="px-3 py-2.5 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: `${pColor}18`, color: pColor }}
                          >
                            {CATEGORY_ICON[rec.category] ?? CATEGORY_ICON.risk}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <p className="text-xs font-semibold text-white/80">{rec.title}</p>
                              <span
                                className="text-[10px] font-medium px-1.5 py-px rounded-full"
                                style={{ background: `${pColor}18`, color: pColor }}
                              >
                                {rec.priority}
                              </span>
                            </div>
                            <p className="text-xs text-white/40 leading-relaxed">{rec.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Market context */}
                  {msg.response?.marketContext && (
                    <p className="text-xs text-white/20 italic px-1 leading-relaxed">
                      {msg.response.marketContext}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl rounded-tl-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'rgba(255,255,255,0.3)', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div
        className="pt-3 mt-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Give me recommendations based on my portfolio"
            disabled={loading}
            className="flex-1 text-xs px-3 py-2.5 rounded-xl outline-none text-white placeholder-white/20 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <button
            disabled={!input.trim() || loading}
            onClick={() => sendMessage()}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl transition-all hover:opacity-90 disabled:opacity-30 flex-shrink-0"
            style={{ background: '#C9A227', color: '#080808' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
