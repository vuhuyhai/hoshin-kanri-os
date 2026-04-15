import type { TocItem } from '@/lib/blog/toc'

export function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.length < 2) return null

  return (
    <nav
      aria-label="Mục lục bài viết"
      className="card-brutal mb-10 bg-bg-muted-warm p-6"
    >
      <p className="heading-overline mb-3">Mục lục</p>
      <ol className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={
              item.level === 3
                ? 'ml-5 list-none font-body text-[14px] leading-snug text-text-2'
                : 'list-none font-display text-[13px] font-bold uppercase tracking-wide text-ink'
            }
          >
            <a
              href={`#${item.id}`}
              className="hover:text-accent-brand hover:underline"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
