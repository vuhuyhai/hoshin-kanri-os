'use client'

import { useEffect, useRef } from 'react'

export function ViewTracker({ slug }: { slug: string }) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    const key = `blog-view:${slug}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // sessionStorage may be unavailable (SSR-safe guard / privacy mode)
    }

    fetch(`/api/blog/${encodeURIComponent(slug)}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {})
  }, [slug])

  return null
}
