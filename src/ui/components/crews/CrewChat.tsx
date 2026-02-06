/**
 * Crew Chat Component
 * Chat interno do crew
 */

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

interface ChatMessage {
  id: string
  user_id: string
  message: string
  created_at: string
  user: {
    id: string
    username: string
    avatar_url?: string
  }
}

interface CrewChatProps {
  crewId: string
}

export function CrewChat({ crewId }: CrewChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000) // Poll a cada 5s
    return () => clearInterval(interval)
  }, [crewId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/v1/crews/${crewId}/chat`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await res.json()

      if (data.success) {
        setMessages(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)

      const res = await fetch('/api/v1/crews/chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newMessage })
      })

      const data = await res.json()

      if (data.success) {
        setNewMessage('')
        fetchMessages()
      } else {
        alert(data.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-[400px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            Nenhuma mensagem ainda. Seja o primeiro a falar!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {msg.user.avatar_url ? (
                  <img
                    src={msg.user.avatar_url}
                    alt={msg.user.username}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  msg.user.username.charAt(0).toUpperCase()
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold text-sm">{msg.user.username}</span>
                  <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                </div>
                <p className="text-sm text-gray-300">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Digite sua mensagem..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={sending}
          className="flex-1 bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}
