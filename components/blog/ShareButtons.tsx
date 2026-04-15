'use client'

import { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  url: string
  title: string
}

export function ShareButtons({ url, title }: Props) {
  const [copying, setCopying] = useState(false)

  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  const xHref = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`

  const copy = async () => {
    if (copying) return
    setCopying(true)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Đã copy link bài viết')
    } catch {
      toast.error('Trình duyệt không cho phép copy, bạn copy thủ công nhé')
    } finally {
      setTimeout(() => setCopying(false), 400)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-display text-[11px] font-bold uppercase tracking-wider text-text-3">
        Chia sẻ:
      </span>
      <a
        href={fbHref}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-brutal-secondary px-4 py-2 text-[11px]"
      >
        Facebook
      </a>
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-brutal-secondary px-4 py-2 text-[11px]"
      >
        X (Twitter)
      </a>
      <button
        type="button"
        onClick={copy}
        className="btn-brutal-secondary px-4 py-2 text-[11px] disabled:opacity-60"
        disabled={copying}
      >
        {copying ? 'Đang copy…' : 'Copy link'}
      </button>
    </div>
  )
}
