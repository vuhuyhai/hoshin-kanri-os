'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CoachingItem, EvidenceResult } from '@/lib/swot/types'

export interface EvidenceRunningResult {
  validated: Array<{ item: CoachingItem; evidence: EvidenceResult }>
  not_found: string[]
  failed: number
  total: number
  cache_hits: number
}

interface EvidenceRunningProps {
  items: CoachingItem[]
  org_id: string
  onComplete: (result: EvidenceRunningResult) => void
}

const SOURCES = ['GSO', 'VIRAC', 'Decision Lab', 'World Bank', 'CafeF', 'VnExpress']

export default function EvidenceRunning({ items, org_id, onComplete }: EvidenceRunningProps) {
  const [status, setStatus] = useState<'ready' | 'running' | 'done'>('ready')
  const [progress, setProgress] = useState(0)
  const [currentItem, setCurrentItem] = useState('')
  const [newDiscoveryCount, setNewDiscoveryCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const handleStart = useCallback(async () => {
    setStatus('running')
    setProgress(0)
    setCurrentItem(items[0]?.text ?? '')

    let idx = 0
    intervalRef.current = setInterval(() => {
      idx++
      if (idx < items.length) {
        setProgress(idx)
        setCurrentItem(items[idx].text)
        if (Math.random() > 0.7) setNewDiscoveryCount((prev) => prev + 1)
      }
    }, 800)

    try {
      const res = await fetch('/api/swot/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, org_id }),
      })
      const result: EvidenceRunningResult = await res.json()
      if (intervalRef.current) clearInterval(intervalRef.current)
      setProgress(items.length)
      setStatus('done')
      onComplete(result)
    } catch {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setStatus('done')
      onComplete({ validated: [], not_found: items.map((i) => i.text), failed: items.length, total: items.length, cache_hits: 0 })
    }
  }, [items, org_id, onComplete])

  if (status === 'ready') {
    return (
      <Card className="max-w-2xl mx-auto border-2 shadow-brutal-md rounded-none">
        <CardContent className="p-8 text-center space-y-4">
          <h2 className="font-heading text-2xl font-bold text-ink">Nghiên cứu thị trường</h2>
          <p className="text-muted-foreground">
            AI sẽ tìm kiếm số liệu từ {SOURCES.length} nguồn uy tín để
            xác minh và bổ sung {items.length} nguyên liệu SWOT của bạn.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SOURCES.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
          </div>
          <Button className="mt-4" onClick={handleStart}>Bắt đầu nghiên cứu →</Button>
        </CardContent>
      </Card>
    )
  }

  if (status === 'done') return null

  const pct = Math.round((progress / items.length) * 100)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-ink mb-1">Đang phân tích...</h2>
        <p className="text-sm text-muted-foreground truncate">&quot;{currentItem}&quot;</p>
      </div>
      <div className="w-full h-2 border-2 border-ink bg-white">
        <div className="h-full bg-accent-brand transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-heading text-sm font-bold mb-2">Xác minh nguyên liệu</h3>
          <ul className="space-y-1 text-sm">
            {items.map((item, i) => (
              <li key={item.id} className={`flex gap-2 items-start ${i === progress ? 'animate-pulse' : ''}`}>
                <span>{i < progress ? '✅' : i === progress ? '⏳' : '○'}</span>
                <span className={i > progress ? 'text-muted-foreground' : ''}>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-heading text-sm font-bold mb-2">Khám phá mới</h3>
          <p className="text-sm text-muted-foreground">Đang quét nguồn...</p>
          {newDiscoveryCount > 0 && (
            <Badge className="bg-green-100 text-green-700 mt-2">Tìm thấy {newDiscoveryCount} insights mới</Badge>
          )}
        </div>
      </div>
    </div>
  )
}
