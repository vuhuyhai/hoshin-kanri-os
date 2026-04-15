import Link from 'next/link'
import type { TagRef } from '@/lib/blog/queries'

export function PostTags({ tags }: { tags: TagRef[] }) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-display text-[11px] font-bold uppercase tracking-wider text-text-3">
        Tags:
      </span>
      {tags.map((t) => (
        <Link
          key={t.id}
          href={`/blog?tag=${t.slug}`}
          className="badge-brutal border-ink text-ink hover:border-accent-brand hover:text-accent-brand"
        >
          #{t.name}
        </Link>
      ))}
    </div>
  )
}
