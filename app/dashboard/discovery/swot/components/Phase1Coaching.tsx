'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CoachingState, ChatMessage, OrgContext } from '@/lib/swot/types'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialSent = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  useEffect(() => {
    if (state.messages.length === 0 && !initialSent.current) {
      initialSent.current = true
      sendMessage('')
    }
  }, [])

  const sendMessage = async (userInput: string) => {
    const newMessages: ChatMessage[] = userInput
      ? [...state.messages, { role: 'user', content: userInput }]
      : state.messages

    onStateChange({ ...state, messages: newMessages, isLoading: true })
    setInputText('')

    try {
      const response = await fetch('/api/swot/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.length > 0 ? newMessages : [{ role: 'user', content: 'Xin chào, hãy bắt đầu phân tích.' }],
          orgContext,
          currentFramework: state.currentFramework,
        }),
      })

      if (!response.ok) throw new Error('API error')
      const data = await response.json()

      const updatedMessages: ChatMessage[] = [...newMessages, data.message]

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

  const frameworkLabel =
    state.currentFramework === 'sw'
      ? '🔍 Phân tích nội tại (8Ms)'
      : '🌐 Phân tích ngoại cảnh (Porter + PESTEL)'

  return (
    <div className="flex h-full max-h-[600px] flex-col">
      <div className="border-b bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
        {frameworkLabel}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {state.messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-tr-sm bg-primary text-primary-foreground'
                  : 'rounded-tl-sm bg-muted'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {state.isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              <div className="flex gap-1">
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 border-t p-4">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) =>
            e.key === 'Enter' && !e.shiftKey && handleSend()
          }
          placeholder="Nhập câu trả lời của bạn..."
          disabled={state.isLoading || state.isComplete}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={!inputText.trim() || state.isLoading || state.isComplete}
        >
          Gửi
        </Button>
      </div>
    </div>
  )
}
