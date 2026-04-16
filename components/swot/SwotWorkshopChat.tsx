'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { Send, Loader2, Plus } from 'lucide-react'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { postJson, FetchJsonError } from '@/lib/http/fetch-json'
import type { ChatMessage, CoachingResponse, SwotQuadrant } from '@/lib/swot/types'

interface SwotWorkshopChatProps {
  orgId: string
  onAddIngredient: (quadrant: SwotQuadrant, statement: string) => void
}

const QUADRANT_OPTIONS: { value: SwotQuadrant; label: string }[] = [
  { value: 'S', label: 'S — Điểm mạnh' },
  { value: 'W', label: 'W — Điểm yếu' },
  { value: 'O', label: 'O — Cơ hội' },
  { value: 'T', label: 'T — Thách thức' },
]

const INITIAL_MSG: ChatMessage = {
  role: 'assistant',
  content: 'Xin chào! Tôi là AI coach. Bạn có thể hỏi tôi về bất kỳ góc nhìn SWOT nào, hoặc nhờ tôi gợi ý thêm items cho từng nhóm.',
}

export function SwotWorkshopChat({ orgId, onAddIngredient }: SwotWorkshopChatProps) {
  const contextData = useSwotStore((s) => s.contextData)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [extractText, setExtractText] = useState('')
  const [extractQuadrant, setExtractQuadrant] = useState<SwotQuadrant>('S')

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading || !contextData) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await postJson<CoachingResponse>('/api/swot/coaching', {
        messages: next,
        orgContext: {
          orgId,
          orgName: 'Doanh nghiệp',
          industry: contextData.industry,
          city: contextData.mainMarket,
          headcount: contextData.headcount,
        },
        currentFramework: 'sw',
      })
      setMessages([...next, res.message])
    } catch (err) {
      const msg = err instanceof FetchJsonError ? err.message : 'Lỗi kết nối AI'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleExtractAdd = () => {
    const text = extractText.trim()
    if (text.length < 3) { toast.error('Tối thiểu 3 ký tự'); return }
    onAddIngredient(extractQuadrant, text)
    setExtractText('')
  }

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
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

      <div className="border-t-2 border-ink bg-bg-warm p-3 space-y-2">
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
