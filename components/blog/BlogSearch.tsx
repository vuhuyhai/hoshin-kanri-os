import Link from 'next/link'

type Props = {
  defaultValue?: string
  categorySlug?: string
  tagSlug?: string
}

export function BlogSearch({ defaultValue = '', categorySlug, tagSlug }: Props) {
  const clearQs = new URLSearchParams()
  if (categorySlug) clearQs.set('category', categorySlug)
  if (tagSlug) clearQs.set('tag', tagSlug)
  const clearHref =
    clearQs.toString().length > 0 ? `/blog?${clearQs.toString()}` : '/blog'

  return (
    <form
      action="/blog"
      method="get"
      className="flex w-full items-stretch gap-0"
      role="search"
      aria-label="Tìm bài viết"
    >
      {categorySlug && (
        <input type="hidden" name="category" value={categorySlug} />
      )}
      {tagSlug && <input type="hidden" name="tag" value={tagSlug} />}
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Tìm bài viết theo tiêu đề, tóm tắt…"
        className="flex-1 border-[3px] border-r-0 border-ink bg-bg-warm px-4 py-3 font-body text-[15px] text-ink placeholder:text-text-3 focus:outline-none focus:shadow-[5px_5px_0_#c73937]"
        minLength={2}
        maxLength={80}
      />
      <button type="submit" className="btn-brutal-primary px-6 py-3 text-xs">
        Tìm
      </button>
      {defaultValue && (
        <Link href={clearHref} className="btn-brutal-secondary ml-3 px-5 py-3 text-xs">
          Xoá
        </Link>
      )}
    </form>
  )
}
