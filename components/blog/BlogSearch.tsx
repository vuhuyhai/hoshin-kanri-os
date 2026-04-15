import Link from 'next/link'

type Props = {
  defaultValue?: string
  categorySlug?: string
}

export function BlogSearch({ defaultValue = '', categorySlug }: Props) {
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
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Tìm bài viết theo tiêu đề, tóm tắt…"
        className="flex-1 border-[3px] border-r-0 border-ink bg-bg-warm px-4 py-3 font-body text-[15px] text-ink placeholder:text-text-3 focus:outline-none focus:shadow-[5px_5px_0_#c73937]"
        minLength={2}
        maxLength={80}
      />
      <button
        type="submit"
        className="btn-brutal-primary px-6 py-3 text-xs"
      >
        Tìm
      </button>
      {defaultValue && (
        <Link
          href={categorySlug ? `/blog?category=${categorySlug}` : '/blog'}
          className="btn-brutal-secondary ml-3 px-5 py-3 text-xs"
        >
          Xoá
        </Link>
      )}
    </form>
  )
}
