export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Suspense } from 'react'
import { adminListCategories } from '@/lib/blog/queries'
import { createCategoryAction } from '../_actions'
import { CategoryForm } from './CategoryForm'
import { EditableCategoryRow } from './EditableCategoryRow'

const MIGRATION_HINT =
  'Database chưa sẵn sàng: bảng blog_categories chưa tồn tại. Hãy apply migration 023_blog_categories.sql qua Supabase SQL Editor.'

async function CategoriesContent() {
  let rows: Awaited<ReturnType<typeof adminListCategories>> = []
  let loadError: string | null = null
  try {
    rows = await adminListCategories()
  } catch (e) {
    console.error('[admin/blog/categories] list failed:', e)
    const err = e as { code?: string; message?: string }
    if (
      err.code === 'PGRST205' ||
      err.code === '42P01' ||
      err.message?.includes("Could not find the table 'public.blog_categories'")
    ) {
      loadError = MIGRATION_HINT
    } else {
      loadError = err.message ?? 'Không tải được danh mục'
    }
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
            Danh mục
          </h1>
          <span className="badge-brutal border-ink text-ink">{rows.length}</span>
        </div>
      </div>

      <div className="card-brutal p-6">
        <p className="mb-4 font-display text-[11px] font-bold uppercase tracking-wider text-text-3">
          Thêm danh mục mới
        </p>
        <CategoryForm
          action={createCategoryAction}
          submitLabel="+ Tạo danh mục"
          successMessage="Đã tạo danh mục"
          resetOnSuccess
          compact
        />
      </div>

      {loadError ? (
        <div className="card-brutal border-accent-brand p-6">
          <p className="font-display text-sm font-bold uppercase text-accent-brand">
            Không tải được danh mục
          </p>
          <p className="mt-3 font-body text-[15px] text-ink">{loadError}</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="card-brutal p-10 text-center">
          <p className="font-display text-lg font-bold uppercase text-ink">
            Chưa có danh mục
          </p>
          <p className="mt-2 font-body text-text-2">
            Dùng form ở trên để tạo danh mục đầu tiên.
          </p>
        </div>
      ) : (
        <div className="border-[3px] border-ink bg-bg-warm shadow-[5px_5px_0_#2C2B2B]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-[3px] border-ink bg-ink text-bg-warm">
                <th className="px-4 py-3 font-display text-[11px] font-black uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-4 py-3 font-display text-[11px] font-black uppercase tracking-wider">
                  Slug
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
                <EditableCategoryRow key={r.id} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default function BlogCategoriesPage() {
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
        <CategoriesContent />
      </Suspense>
    </div>
  )
}
