'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RecommendationResponse, Portfolio, WellnessScore, RiskProfile, ConversationMessage } from '@/types'
import { supabase } from '@/lib/supabase'
import { GlowingEffect } from '@/components/ui/glowing-effect'

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

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
}

const GOLD = '#C9A227'

const PRIORITY_COLOR: Record<string, string> = {
  high: '#EF4444',
  medium: GOLD,
  low: '#6B7280',
}

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  diversification: (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
    </svg>
  ),
  liquidity: (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  risk: (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  opportunity: (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
}

export default function AIRecommendations({
  clientId, portfolio, wellnessScore, riskProfile,
}: AIRecommendationsProps) {
  const [sessionId] = useState<string>(() => crypto.randomUUID())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pastSessions, setPastSessions] = useState<ChatSession[]>([])
  const [activeTab, setActiveTab] = useState<'new' | string>('new')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadSessions() {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('client_id', clientId)
        .not('session_id', 'is', null)
        .order('created_at', { ascending: true })

      if (!data || data.length === 0) return

      const map = new Map<string, ChatMessage[]>()
      for (const row of data) {
        const sid = row.session_id as string
        if (!map.has(sid)) map.set(sid, [])
        map.get(sid)!.push({
          id: row.id as string,
          role: row.role as 'user' | 'assistant',
          text: row.content as string,
          response: row.response ?? undefined,
          timestamp: new Date(row.created_at as string).getTime(),
        })
      }

      const sessions: ChatSession[] = Array.from(map.entries())
        .map(([sid, msgs]) => {
          const firstUser = msgs.find(m => m.role === 'user')
          const raw = firstUser?.text ?? 'Chat'
          const title = raw.length > 24 ? raw.slice(0, 24) + '…' : raw
          return { id: sid, title, messages: msgs }
        })
        .reverse()

      setPastSessions(sessions)
    }
    loadSessions()
  }, [clientId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, activeTab])

  const buildConversationHistory = (msgs: ChatMessage[]): ConversationMessage[] =>
    msgs.map(m => ({
      role: m.role,
      content: m.role === 'assistant' && m.response ? JSON.stringify(m.response) : m.text,
    }))

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    setInput('')

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    await supabase.from('chat_messages').insert({
      client_id: clientId,
      session_id: sessionId,
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
      setMessages(prev => [...prev, assistantMsg])

      await supabase.from('chat_messages').insert({
        client_id: clientId,
        session_id: sessionId,
        role: 'assistant',
        content: isChat ? (data.message || '') : data.summary,
        response: isChat ? null : data,
      })
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'Something went wrong. Please try again.',
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, loading, clientId, sessionId, portfolio, wellnessScore, riskProfile, messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = async () => {
    setMessages([])
    await supabase.from('chat_messages').delete()
      .eq('client_id', clientId)
      .eq('session_id', sessionId)
  }

  const displayMessages = activeTab === 'new'
    ? messages
    : (pastSessions.find(s => s.id === activeTab)?.messages ?? [])

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '380px' }}>

      {/* Session tabs */}
      {pastSessions.length > 0 && (
        <div
          className="flex gap-1.5 mb-3 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="relative rounded-full flex-shrink-0">
            <GlowingEffect spread={15} glow={false} disabled={false} proximity={30} inactiveZone={0.01} borderWidth={1} />
            <button
              onClick={() => setActiveTab('new')}
              className="relative text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all"
              style={activeTab === 'new'
                ? { background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30` }
                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >
              + New
            </button>
          </div>
          {pastSessions.slice(0, 4).map(s => (
            <div key={s.id} className="relative rounded-full flex-shrink-0">
              <GlowingEffect spread={15} glow={false} disabled={false} proximity={30} inactiveZone={0.01} borderWidth={1} />
              <button
                onClick={() => setActiveTab(s.id)}
                className="relative text-[10px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-all"
                style={activeTab === s.id
                  ? { background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30` }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }
                }
              >
                {s.title}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clear button */}
      {activeTab === 'new' && messages.length > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={clearChat}
            className="text-[10px] transition-colors"
            style={{ color: 'var(--text-caption)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-caption)')}
          >
            Clear chat
          </button>
        </div>
      )}

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-0.5"
        style={{ maxHeight: '320px', scrollbarWidth: 'thin' }}
      >
        <AnimatePresence initial={false}>
          {displayMessages.length === 0 && activeTab === 'new' && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 gap-3"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.15)' }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth="1.6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <p className="text-xs text-center" style={{ color: 'var(--text-caption)' }}>
                Ask anything about your portfolio
              </p>
            </motion.div>
          )}

          {displayMessages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div
                  className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-xs text-white leading-relaxed"
                  style={{
                    background: 'rgba(201,162,39,0.14)',
                    border: '1px solid rgba(201,162,39,0.22)',
                  }}
                >
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-[96%] space-y-2">
                  {msg.text && (
                    <div
                      className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed"
                      style={{
                        background: 'rgba(255,255,255,0.045)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {msg.text}
                    </div>
                  )}

                  {msg.response?.recommendations?.map((rec, i) => {
                    const pColor = PRIORITY_COLOR[rec.priority] ?? '#6B7280'
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="rounded-xl overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        {/* Priority strip */}
                        <div className="h-0.5 w-full" style={{ background: pColor }} />
                        <div className="px-3 py-2.5">
                          <div className="flex items-start gap-2">
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: `${pColor}18`, color: pColor }}
                            >
                              {PRIORITY_ICON[rec.category] ?? PRIORITY_ICON.risk}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{rec.title}</p>
                                <span
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                                  style={{ background: `${pColor}18`, color: pColor }}
                                >
                                  {rec.priority}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{rec.description}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                  {msg.response?.marketContext && (
                    <p className="text-xs italic px-1 leading-relaxed" style={{ color: 'var(--text-caption)' }}>
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
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div
              className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm"
              style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: GOLD }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input bar */}
      {activeTab === 'new' ? (
        <div className="pt-3 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your portfolio…"
              disabled={loading}
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl outline-none text-white placeholder-white/20 disabled:opacity-50 transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(201,162,39,0.35)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
            <motion.button
              disabled={!input.trim() || loading}
              onClick={() => sendMessage()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: '#DFD0B8', color: '#080808' }}
            >
              <GlowingEffect spread={20} glow={false} disabled={false} proximity={40} inactiveZone={0.01} borderWidth={2} />
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="pt-3 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="relative rounded-xl">
            <GlowingEffect spread={25} glow={false} disabled={false} proximity={50} inactiveZone={0.01} borderWidth={1} />
            <button
              onClick={() => setActiveTab('new')}
              className="relative w-full text-xs py-2 rounded-xl transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-caption)' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(223,208,184,0.25)'
                e.currentTarget.style.color = '#DFD0B8'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.color = 'var(--text-caption)'
              }}
            >
              + Start new chat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
