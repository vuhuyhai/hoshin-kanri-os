'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { Send, Loader2, Plus } from 'lucide-react'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { postJson, FetchJsonError } from '@/lib/http/fetch-json'
import type { ChatMessage, CoachingResponse, SwotQuadrant } from '@/lib/swot/types'

interface SwotWorkshopChatProps {
  orgId: string
  onAddIngredient: (
    quadrant: SwotQuadrant,
    statement: string,
    source?: 'chat_extract' | 'ai_auto',
  ) => string
}

const QUADRANT_OPTIONS: { value: SwotQuadrant; label: string }[] = [
  { value: 'S', label: 'S — Điểm mạnh' },
  { value: 'W', label: 'W — Điểm yếu' },
  { value: 'O', label: 'O — Cơ hội' },
  { value: 'T', label: 'T — Thách thức' },
]

const INITIAL_MSG_SW: ChatMessage = {
  role: 'assistant',
  content: 'Chào CEO! Em là **Minh** — AI Coach chiến lược. Em sẽ giúp anh nhìn lại **nội bộ doanh nghiệp** (đội ngũ, hệ thống, sản phẩm, tài chính...). Anh muốn bắt đầu từ chủ đề nào? Hoặc nếu có sẵn ý gì, anh paste vào, em sẽ nhóm và hỏi root cause.',
}

const INITIAL_MSG_OT: ChatMessage = {
  role: 'assistant',
  content: 'Chào CEO! Em là **Minh**. Giờ mình nhìn ra **bên ngoài** — thị trường, đối thủ, xu hướng, regulation. Anh muốn bắt đầu từ đâu? Cạnh tranh? Khách hàng? Hay anh paste sẵn các quan sát, em sẽ nhóm và hỏi sâu.',
}

export function SwotWorkshopChat({ orgId, onAddIngredient }: SwotWorkshopChatProps) {
  const contextData = useSwotStore((s) => s.contextData)
  const currentFramework = useSwotStore((s) => s.currentFramework)
  const swMessages = useSwotStore((s) => s.swMessages)
  const otMessages = useSwotStore((s) => s.otMessages)
  const setSwMessages = useSwotStore((s) => s.setSwMessages)
  const setOtMessages = useSwotStore((s) => s.setOtMessages)
  const removeIngredient = useSwotStore((s) => s.removeIngredient)
  const [input, setInput] = useState('')

  // Derived: messages từ store, lazy inject INITIAL_MSG nếu empty
  const messages: ChatMessage[] = currentFramework === 'sw'
    ? (swMessages.length === 0 ? [INITIAL_MSG_SW] : swMessages)
    : (otMessages.length === 0 ? [INITIAL_MSG_OT] : otMessages)

  // Helper: setter dynamic theo currentFramework
  const setMessages = (msgs: ChatMessage[]) => {
    if (currentFramework === 'sw') setSwMessages(msgs)
    else setOtMessages(msgs)
  }
  const [loading, setLoading] = useState(false)
  const [extractText, setExtractText] = useState('')
  const [extractQuadrant, setExtractQuadrant] = useState<SwotQuadrant>('S')
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, loading])

  const sendMessages = async (msgs: ChatMessage[]) => {
    if (!contextData) return
    // Capture framework snapshot — response commit vào framework gốc kể cả nếu user switch giữa chừng
    const fw = useSwotStore.getState().currentFramework
    setLoading(true)
    try {
      const res = await postJson<CoachingResponse>('/api/swot/coaching', {
        messages: msgs,
        orgContext: {
          orgId,
          orgName: 'Doanh nghiệp',
          industry: contextData.industry,
          city: contextData.mainMarket,
          headcount: contextData.headcount,
        },
        currentFramework: fw,
      })
      if (fw === 'sw') {
        setSwMessages([...msgs, res.message])
      } else {
        setOtMessages([...msgs, res.message])
      }

      // Auto-fill ingredient từ extractedInsight (M-AICoach-Sensei-1 Task 6D)
      const insight = res.extractedInsight
      if (
        insight &&
        insight.confidence !== 'low' &&
        insight.insight.trim().length >= 5
      ) {
        const id = onAddIngredient(insight.quadrant, insight.insight, 'ai_auto')
        const preview = insight.insight.length > 60
          ? insight.insight.slice(0, 60) + '...'
          : insight.insight
        toast.success(`✓ Đã thêm vào ${insight.quadrant}: ${preview}`, {
          action: {
            label: 'Hoàn tác',
            onClick: () => {
              removeIngredient(id)
              toast.success('Đã hoàn tác')
            },
          },
          duration: 5000,
        })
      }
    } catch (err) {
      const errMsg = err instanceof FetchJsonError
        ? err.message
        : 'Không thể kết nối AI coach. Thử lại.'
      toast.error(errMsg, {
        action: { label: 'Thử lại', onClick: () => { void sendMessages(msgs) } },
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading || !contextData) return
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    await sendMessages(next)
  }

  const handleExtractAdd = () => {
    const text = extractText.trim()
    if (text.length < 3) { toast.error('Tối thiểu 3 ký tự'); return }
    onAddIngredient(extractQuadrant, text)
    setExtractText('')
  }

  return (
    <div className="flex flex-col w-full h-full max-h-full min-h-0 bg-white">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-scroll overflow-x-hidden p-4 space-y-3 min-h-0 chat-scrollbar"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] border-2 border-ink p-3 shadow-[3px_3px_0_#2C2B2B] ${m.role === 'user' ? 'bg-ink text-white' : 'bg-bg-warm text-ink'}`}>
              <div className="prose prose-sm max-w-none font-display [&_p]:mb-1 [&_p:last-child]:mb-0 [&_ul]:my-1 [&_strong]:font-bold">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="border-2 border-ink bg-bg-warm p-3 shadow-[3px_3px_0_#2C2B2B] inline-flex items-center gap-2 text-ink">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-display text-sm">AI đang suy nghĩ...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t-2 border-ink bg-bg-warm p-3 space-y-2">
        <div className="flex items-center gap-2">
          <input
            value={extractText}
            onChange={(e) => setExtractText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleExtractAdd() }}
            placeholder="Rút ý từ chat..."
            className="flex-1 min-w-0 border-2 border-ink bg-white px-2 py-1.5 font-display text-sm text-ink focus:outline-none"
          />
          <select
            value={extractQuadrant}
            onChange={(e) => setExtractQuadrant(e.target.value as SwotQuadrant)}
            className="border-2 border-ink bg-white px-2 py-1.5 font-display text-sm text-ink focus:outline-none appearance-none"
          >
            {QUADRANT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExtractAdd}
            className="border-2 border-ink bg-green-600 text-white p-1.5 hover:bg-green-700 transition-colors"
            aria-label="Thêm vào nguyên liệu"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            rows={2}
            placeholder="Hỏi AI coach về chiến lược..."
            className="flex-1 border-2 border-ink bg-white px-2 py-1.5 font-display text-sm text-ink focus:outline-none resize-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="border-2 border-ink bg-ink text-white p-2 hover:bg-accent-brand disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-stretch"
            aria-label="Gửi"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
