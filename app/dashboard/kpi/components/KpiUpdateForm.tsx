'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { trackKpiEntryAdded } from '@/lib/analytics/events'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { postJson } from '@/lib/http/fetch-json'

interface KpiUpdateFormProps {
  kpiId: string
  kpiName: string
  unit: string
  currentValue: number | null
  onSaved: (newValue: number, date: string) => void
  onCancel: () => void
}

export function KpiUpdateForm({
  kpiId,
  kpiName,
  unit,
  currentValue,
  onSaved,
  onCancel,
}: KpiUpdateFormProps) {
  const [value, setValue] = useState(currentValue?.toString() ?? '')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const parsedValue = parseFloat(value)
  const isValid = !isNaN(parsedValue) && value.trim() !== ''

  const handleSave = async () => {
    if (!isValid) return
    setIsSaving(true)

    const today = new Date().toISOString().split('T')[0]

    try {
      await postJson('/api/kpi/entry', {
        kpiId,
        value: parsedValue,
        note: note.trim() || undefined,
        periodDate: today,
      })
      toast.success(`${kpiName}: ${parsedValue} ${unit} ✓`)
      trackKpiEntryAdded({ kpiId, value: parsedValue, deptLevel: 'company' })
      onSaved(parsedValue, today)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const ne = e.nativeEvent as KeyboardEvent
    if (ne.isComposing || ne.keyCode === 229) return
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="mt-3 space-y-2 pt-3 border-t">
      <div className="flex gap-2 items-center">
        <Input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Giá trị..."
          className={cn(
            'flex-1 h-8 text-sm',
            !isValid && value !== '' ? 'border-destructive' : ''
          )}
          disabled={isSaving}
        />
        <span className="text-xs text-muted-foreground shrink-0">{unit}</span>
      </div>

      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ghi chú ngắn (Enter để lưu)..."
        className="h-8 text-xs"
        disabled={isSaving}
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className="flex-1 h-7 text-xs bg-primary hover:bg-primary/90"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
          className="h-7 text-xs"
        >
          Huỷ
        </Button>
      </div>
    </div>
  )
}
