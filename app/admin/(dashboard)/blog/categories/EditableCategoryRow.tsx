'use client'

import { useState } from 'react'
import { CategoryForm } from './CategoryForm'
import { DeleteCategoryButton } from './DeleteCategoryButton'
import { updateCategoryAction } from '../_actions'

type Row = {
  id: string
  slug: string
  name: string
  description: string | null
  post_count: number
  updated_at: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function EditableCategoryRow({ row }: { row: Row }) {
  const [editing, setEditing] = useState(false)
  const boundAction = updateCategoryAction.bind(null, row.id)

  if (editing) {
    return (
      <tr className="border-b-[2px] border-ink/20 last:border-b-0 bg-bg-muted-warm">
        <td colSpan={5} className="p-4">
          <CategoryForm
            action={async (prev, fd) => {
              const result = await boundAction(prev, fd)
              if (result?.ok) setEditing(false)
              return result
            }}
            initial={{
              slug: row.slug,
              name: row.name,
              description: row.description ?? '',
            }}
            submitLabel="Lưu thay đổi"
            successMessage="Đã cập nhật danh mục"
            compact
          />
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-2 hover:text-ink"
            >
              Huỷ
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b-[2px] border-ink/20 last:border-b-0 hover:bg-bg-muted-warm">
      <td className="px-4 py-3">
        <p className="font-display text-sm font-bold text-ink">{row.name}</p>
        {row.description && (
          <p className="mt-0.5 font-body text-[13px] text-text-2 line-clamp-1">
            {row.description}
          </p>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-[12px] text-text-3">/{row.slug}</td>
      <td className="px-4 py-3 font-display text-sm text-ink">{row.post_count}</td>
      <td className="px-4 py-3 font-body text-sm text-text-2">
        {formatDate(row.updated_at)}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-display text-[11px] font-semibold uppercase tracking-wider text-ink hover:text-accent-brand"
          >
            Sửa
          </button>
          <DeleteCategoryButton id={row.id} name={row.name} postCount={row.post_count} />
        </div>
      </td>
    </tr>
  )
}
