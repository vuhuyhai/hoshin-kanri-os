'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { addNoteAction } from '../_actions'
import type { AdminNote } from '@/lib/admin/types'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN')
}

export function AdminNotesSection({
  orgId,
  initialNotes,
}: {
  orgId: string
  initialNotes: AdminNote[]
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!content.trim()) return
    setLoading(true)
    const result = await addNoteAction(orgId, content)
    setLoading(false)

    if (result.ok) {
      toast.success('Đã thêm ghi chú')
      // Optimistic: prepend the new note
      setNotes((prev) => [
        {
          id: crypto.randomUUID(),
          org_id: orgId,
          content: content.trim(),
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
      setContent('')
    } else {
      toast.error(result.error ?? 'Lỗi thêm ghi chú')
    }
  }

  return (
    <div className="border-[3px] border-ink bg-bg-warm shadow-[5px_5px_0_#2C2B2B]">
      <div className="border-b-[3px] border-ink px-5 py-3">
        <h2 className="font-display text-sm font-black uppercase tracking-wider text-ink">
          Ghi chú admin
        </h2>
      </div>

      <div className="p-5 space-y-4">
        {/* Add note form */}
        <div className="space-y-2">
          <Textarea
            placeholder="Ghi chú về khách hàng này..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            className="min-h-[80px] border-2 border-ink bg-bg-warm font-body"
          />
          <Button
            onClick={handleAdd}
            disabled={loading || !content.trim()}
            className="btn-brutal-primary min-h-[36px] text-xs"
          >
            {loading ? 'Đang lưu...' : 'Thêm ghi chú'}
          </Button>
        </div>

        {/* Notes list */}
        {notes.length === 0 ? (
          <p className="font-body text-sm text-text-3">Chưa có ghi chú nào.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border-l-[3px] border-ink/20 pl-4 py-1"
              >
                <p className="font-body text-sm text-ink whitespace-pre-wrap">
                  {note.content}
                </p>
                <p className="mt-1 font-body text-[11px] text-text-3">
                  {formatDateTime(note.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
