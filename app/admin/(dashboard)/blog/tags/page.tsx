export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Suspense } from 'react'
import { adminListTags } from '@/lib/blog/queries'
import { describeDbError } from '@/lib/blog/errors'
import { createTagAction } from '../_actions'
import { TagForm } from './TagForm'
import { EditableTagRow } from './EditableTagRow'

async function TagsContent() {
  let rows: Awaited<ReturnType<typeof adminListTags>> = []
  let loadError: string | null = null
  try {
    rows = await adminListTags()
  } catch (e) {
    console.error('[admin/blog/tags] list failed:', e)
    loadError = describeDbError(e)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="font-display text-[11px] font-semibold uppercase tracking-wider text-text-3 hover:text-accent-brand"
          >
            ← Blog
          </Link>
          <h1 className="font-display text-2xl font-black uppercase tracking-wider text-ink">
            Tags
          </h1>
          <span className="badge-brutal border-ink text-ink">{rows.length}</span>
        </div>
      </div>

      <div className="card-brutal p-6">
        <p className="mb-4 font-display text-[11px] font-bold uppercase tracking-wider text-text-3">
          Thêm tag mới
        </p>
        <TagForm
          action={createTagAction}
          submitLabel="+ Tạo tag"
          successMessage="Đã tạo tag"
          resetOnSuccess
          compact
        />
      </div>

      {loadError ? (
        <div className="card-brutal border-accent-brand p-6">
          <p className="font-display text-sm font-bold uppercase text-accent-brand">
            Không tải được tag
          </p>
          <p className="mt-3 font-body text-[15px] text-ink">{loadError}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="card-brutal p-10 text-center">
          <p className="font-display text-lg font-bold uppercase text-ink">
            Chưa có tag
          </p>
          <p className="mt-2 font-body text-text-2">
            Dùng form ở trên để tạo tag đầu tiên.
          </p>
        </div>
      ) : (
        <div className="border-[3px] border-ink bg-bg-warm shadow-[5px_5px_0_#2C2B2B]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-[3px] border-ink bg-ink text-bg-warm">
                <th className="px-4 py-3 font-display text-[11px] font-black uppercase tracking-wider">
                  Tên / Slug
                </th>
                <th className="px-4 py-3 font-display text-[11px] font-black uppercase tracking-wider">
                  Số bài
                </th>
                <th className="px-4 py-3 font-display text-[11px] font-black uppercase tracking-wider">
                  Cập nhật
                </th>
                <th className="px-4 py-3 font-display text-[11px] font-black uppercase tracking-wider">
                  {''}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <EditableTagRow key={r.id} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default function BlogTagsPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse bg-ink/10" />
            <div className="h-32 animate-pulse bg-ink/10" />
          </div>
        }
      >
        <TagsContent />
      </Suspense>
    </div>
  )
}
