'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ChatMessage } from '@/components/swot/ChatMessage'
import type { CoachingState, ChatMessage as ChatMsg, OrgContext } from '@/lib/swot/types'

interface Phase1CoachingProps {
  orgContext: OrgContext
  state: CoachingState
  onStateChange: (state: CoachingState) => void
  onPhaseComplete: () => void
}

export function Phase1Coaching({
  orgContext,
  state,
  onStateChange,
  onPhaseComplete,
}: Phase1CoachingProps) {
  const [inputText, setInputText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const initialSent = useRef(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [state.messages, state.isLoading])

  useEffect(() => {
    if (state.messages.length === 0 && !initialSent.current) {
      initialSent.current = true
      sendMessage('')
    }
  }, [])

  const sendMessage = async (userInput: string) => {
    const newMessages: ChatMsg[] = userInput
      ? [...state.messages, { role: 'user', content: userInput }]
      : state.messages

    onStateChange({ ...state, messages: newMessages, isLoading: true })
    setInputText('')

    try {
      const response = await fetch('/api/swot/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:
            newMessages.length > 0
              ? newMessages
              : [
                  {
                    role: 'user',
                    content: 'Xin chào, hãy bắt đầu phân tích.',
                  },
                ],
          orgContext,
          currentFramework: state.currentFramework,
        }),
      })

      if (!response.ok) throw new Error('API error')
      const data = await response.json()

      const updatedMessages: ChatMsg[] = [...newMessages, data.message]

      if (data.isCoachingComplete) {
        if (state.currentFramework === 'sw') {
          onStateChange({
            ...state,
            messages: updatedMessages,
            currentFramework: 'ot',
            isLoading: false,
          })
        } else {
          onStateChange({
            ...state,
            messages: updatedMessages,
            isComplete: true,
            isLoading: false,
          })
          setTimeout(onPhaseComplete, 1000)
        }
      } else {
        onStateChange({
          ...state,
          messages: updatedMessages,
          isLoading: false,
        })
      }
    } catch {
      toast.error('Kết nối AI gián đoạn. Thử lại.')
      onStateChange({ ...state, isLoading: false })
    }
  }

  const handleSend = () => {
    if (!inputText.trim() || state.isLoading) return
    sendMessage(inputText.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const frameworkLabel =
    state.currentFramework === 'sw'
      ? 'Phân tích nội tại (8Ms)'
      : 'Phân tích ngoại cảnh (Porter + PESTEL)'

  const totalDimensions = state.currentFramework === 'sw' ? 8 : 11
  const messageCount = state.messages.filter((m) => m.role === 'user').length
  const progress = Math.min(messageCount / totalDimensions, 1)

  return (
    <div className="flex h-full max-h-[650px] flex-col">
      {/* Header — framework indicator */}
      <div className="px-4 py-3 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary animate-pulse" />
          <span className="text-sm font-display font-semibold text-primary">
            {frameworkLabel}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {messageCount}/{totalDimensions} dimensions
          </span>
        </div>
        <div className="mt-2 h-1 bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {state.messages.map((msg, idx) => (
          <ChatMessage key={idx} role={msg.role} content={msg.content} />
        ))}

        {state.isLoading && (
          <ChatMessage role="assistant" content="" isStreaming />
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t bg-background">
        <div className="flex gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu trả lời của bạn..."
            disabled={state.isLoading || state.isComplete}
            rows={1}
            className="flex-1 px-4 py-2.5 text-sm border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            disabled={
              !inputText.trim() || state.isLoading || state.isComplete
            }
            className="font-display text-xs font-semibold uppercase tracking-wider px-4"
          >
            {state.isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                Gửi
              </span>
            ) : (
              'Gửi'
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 pl-1">
          Enter để gửi · Shift+Enter xuống dòng
        </p>
      </div>
    </div>
  )
}
