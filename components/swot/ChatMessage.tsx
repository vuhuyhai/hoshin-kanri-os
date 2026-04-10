'use client'

import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import { AiCoachAvatar } from './AiCoachAvatar'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

const markdownComponents: Components = {
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-primary mt-3 mb-1">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-none space-y-1 my-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-none space-y-1 my-2 counter-reset-none">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 text-sm">
      <span className="text-primary mt-0.5 shrink-0">▸</span>
      <span>{children}</span>
    </li>
  ),
}

export function ChatMessage({
  role,
  content,
  isStreaming,
}: ChatMessageProps) {
  const isAI = role === 'assistant'

  if (isAI) {
    return (
      <div className="flex gap-3 max-w-[85vw] md:max-w-xl lg:max-w-2xl">
        <div className="shrink-0 mt-1">
          <AiCoachAvatar
            size={40}
            className="w-10 h-10 md:w-12 md:h-12 border-2 border-[#2C2B2B] shadow-[2px_2px_0_#2C2B2B] rounded-full"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-display font-semibold text-primary">
            AI Coach
          </span>
          <div className="bg-card border-2 border-foreground/15 px-4 py-3">
            {isStreaming && content === '' ? (
              <div className="flex gap-1 items-center h-5">
                <span
                  className="w-2 h-2 bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            ) : (
              <div className="text-foreground">
                <ReactMarkdown components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 justify-end max-w-[85vw] md:max-w-xl lg:max-w-2xl ml-auto">
      <div className="flex flex-col items-end gap-1">
        <div className="bg-primary text-primary-foreground border-2 border-primary px-4 py-3">
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
      </div>
      <div className="w-8 h-8 bg-muted border-2 border-foreground/10 flex items-center justify-center shrink-0 mt-1">
        <span className="text-sm">👤</span>
      </div>
    </div>
  )
}
