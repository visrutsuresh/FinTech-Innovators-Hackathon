'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

const GOLD = '#C9A227'

interface DM {
  id: string
  senderId: string
  content: string
  createdAt: number
}

interface DirectMessagesProps {
  myId: string
  otherId: string
  otherName: string
}

function formatMessageTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 864e5)
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (msgDay.getTime() === today.getTime()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  if (msgDay.getTime() === yesterday.getTime()) return 'Yesterday'
  if (now.getTime() - msgDay.getTime() < 7 * 864e5) {
    return d.toLocaleDateString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

export default function DirectMessages({ myId, otherId, otherName }: DirectMessagesProps) {
  const [messages, setMessages] = useState<DM[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('direct_messages')
      .select('id, sender_id, content, created_at')
      .or(
        `and(sender_id.eq.${myId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${myId})`
      )
      .order('created_at', { ascending: true })
      .limit(5000)

    if (data) {
      setMessages(
        data.map(r => ({
          id: r.id as string,
          senderId: r.sender_id as string,
          content: r.content as string,
          createdAt: new Date(r.created_at as string).getTime(),
        }))
      )
    }
    setLoading(false)
  }, [myId, otherId])

  useEffect(() => {
    load()

    // Real-time: listen for messages sent to me by this person
    const channel = supabase
      .channel(`dm:${[myId, otherId].sort().join(':')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${myId}`,
        },
        payload => {
          if (payload.new.sender_id === otherId) {
            setMessages(prev => [
              ...prev,
              {
                id: payload.new.id,
                senderId: payload.new.sender_id,
                content: payload.new.content,
                createdAt: new Date(payload.new.created_at).getTime(),
              },
            ])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [myId, otherId, load])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')

    const { data } = await supabase
      .from('direct_messages')
      .insert({ sender_id: myId, recipient_id: otherId, content: text })
      .select('id, sender_id, content, created_at')
      .single()

    if (data) {
      setMessages(prev => [
        ...prev,
        {
          id: data.id,
          senderId: data.sender_id,
          content: data.content,
          createdAt: new Date(data.created_at).getTime(),
        },
      ])
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col" style={{ height: '340px' }}>
      {/* Thread — all history, newest at bottom */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1.5 pb-2 pr-0.5"
        style={{ scrollbarWidth: 'thin' }}
      >
        {loading ? (
          <p className="text-xs text-white/25 text-center py-6">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-white/20 text-center py-8">
            No messages yet — say hello to {otherName.split(' ')[0]}!
          </p>
        ) : (
          messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.senderId === myId ? 'items-end' : 'items-start'}`}
            >
              <div
                className="max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed"
                style={
                  msg.senderId === myId
                    ? {
                        background: `${GOLD}18`,
                        color: 'rgba(255,255,255,0.85)',
                        border: `1px solid ${GOLD}28`,
                        borderBottomRightRadius: 4,
                      }
                    : {
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.65)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderBottomLeftRadius: 4,
                      }
                }
              >
                {msg.content}
              </div>
              <span
                className="text-[10px] mt-0.5 px-1"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                {formatMessageTime(msg.createdAt)}
              </span>
            </motion.div>
          ))
        )}
      </div>

      {/* Input */}
      <div
        className="flex gap-2 pt-2.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={`Message ${otherName.split(' ')[0]}…`}
          className="flex-1 text-xs px-3 py-2.5 rounded-xl outline-none text-white placeholder-white/20"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="px-3.5 py-2 rounded-xl transition-all disabled:opacity-30 flex-shrink-0"
          style={{ background: GOLD, color: '#080808' }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
