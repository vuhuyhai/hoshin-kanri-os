'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { deleteBlogPostAction } from './_actions'

export function DeletePostButton({
  id,
  title,
}: {
  id: string
  title: string
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (
      !confirm(`Xoá bài "${title}"? Thao tác này không thể hoàn tác.`)
    ) {
      return
    }
    startTransition(async () => {
      const result = await deleteBlogPostAction(id)
      if (result.ok) {
        toast.success('Đã xoá bài viết')
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
