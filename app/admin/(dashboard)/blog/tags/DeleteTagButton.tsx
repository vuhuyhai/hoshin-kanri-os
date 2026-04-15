'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { deleteTagAction } from '../_actions'

export function DeleteTagButton({
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
        ? `Xoá tag "${name}"? ${postCount} bài viết sẽ mất tag này.`
        : `Xoá tag "${name}"?`
    if (!confirm(warn)) return

    startTransition(async () => {
      const result = await deleteTagAction(id)
      if (result.ok) {
        toast.success('Đã xoá tag')
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
