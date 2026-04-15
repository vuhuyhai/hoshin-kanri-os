'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { deleteCategoryAction } from '../_actions'

export function DeleteCategoryButton({
  id,
  name,
  postCount,
}: {
  id: string
  name: string
  postCount: number
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    const warn =
      postCount > 0
        ? `Xoá danh mục "${name}"? ${postCount} bài viết sẽ thành "không có danh mục".`
        : `Xoá danh mục "${name}"?`
    if (!confirm(warn)) return

    startTransition(async () => {
      const result = await deleteCategoryAction(id)
      if (result.ok) {
        toast.success('Đã xoá danh mục')
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="font-display text-[11px] font-semibold uppercase tracking-wider text-accent-brand hover:underline disabled:opacity-50"
    >
      {pending ? 'Đang xoá…' : 'Xoá'}
    </button>
  )
}
