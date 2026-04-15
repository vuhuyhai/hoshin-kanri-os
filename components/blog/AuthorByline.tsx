import type { BlogAuthor } from '@/lib/blog/queries'

export function AuthorByline({ author }: { author: BlogAuthor | null }) {
  const name = author?.full_name?.trim() || 'Hoshin Kanri OS'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-3">
      {author?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.avatar_url}
          alt={name}
          className="h-10 w-10 border-[3px] border-ink object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-10 w-10 items-center justify-center border-[3px] border-ink bg-accent-brand font-display text-sm font-black uppercase text-bg-warm"
        >
          {initial}
        </div>
      )}
      <div className="leading-tight">
        <p className="font-display text-[10px] font-semibold uppercase tracking-wider text-text-3">
          Tác giả
        </p>
        <p className="font-display text-sm font-bold text-ink">{name}</p>
      </div>
    </div>
  )
}
