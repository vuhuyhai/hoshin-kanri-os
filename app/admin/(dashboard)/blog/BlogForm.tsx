'use client'

import {
  useActionState,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer'

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-8 min-w-[34px] items-center justify-center border-[2px] border-ink bg-bg-warm px-2 font-display text-[12px] font-bold text-ink transition-transform hover:bg-accent-brand hover:text-bg-warm active:translate-y-[1px]"
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-1 w-[2px] self-stretch bg-ink/30"
    />
  )
}

type BlogFormInitial = {
  slug: string
  title: string
  excerpt: string
  cover_url: string
  content_md: string
  status: 'draft' | 'published'
  category_id: string
  tag_ids: string[]
}

export type CategoryOption = {
  id: string
  name: string
}

export type TagOption = {
  id: string
  name: string
}

type ActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null

type BlogFormAction = (
  prev: ActionState,
  formData: FormData
) => Promise<ActionState>

const EMPTY: BlogFormInitial = {
  slug: '',
  title: '',
  excerpt: '',
  cover_url: '',
  content_md: '',
  status: 'draft',
  category_id: '',
  tag_ids: [],
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export function BlogForm({
  action,
  initial = EMPTY,
  submitLabel = 'Lưu bài viết',
  categories = [],
  tags = [],
}: {
  action: BlogFormAction
  initial?: BlogFormInitial
  submitLabel?: string
  categories?: CategoryOption[]
  tags?: TagOption[]
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null
  )

  const [title, setTitle] = useState(initial.title)
  const [slug, setSlug] = useState(initial.slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug))
  const [excerpt, setExcerpt] = useState(initial.excerpt)
  const [coverUrl, setCoverUrl] = useState(initial.cover_url)
  const [content, setContent] = useState(initial.content_md)
  const [status, setStatus] = useState<'draft' | 'published'>(initial.status)
  const [categoryId, setCategoryId] = useState(initial.category_id)
  const [tagIds, setTagIds] = useState<string[]>(initial.tag_ids)
  const [showPreview, setShowPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  type TransformResult = { value: string; selStart: number; selEnd: number }

  const applyTransform = (
    fn: (value: string, start: number, end: number) => TransformResult
  ) => {
    const ta = textareaRef.current
    if (!ta) return
    const next = fn(ta.value, ta.selectionStart, ta.selectionEnd)
    setContent(next.value)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(next.selStart, next.selEnd)
    })
  }

  const wrap = (before: string, after: string, placeholder: string) => {
    applyTransform((value, start, end) => {
      const selected = value.slice(start, end)
      const inner = selected || placeholder
      const newValue =
        value.slice(0, start) + before + inner + after + value.slice(end)
      return {
        value: newValue,
        selStart: start + before.length,
        selEnd: start + before.length + inner.length,
      }
    })
  }

  const prefixLines = (prefix: string) => {
    applyTransform((value, start, end) => {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const nextNl = value.indexOf('\n', end)
      const lineEnd = nextNl === -1 ? value.length : nextNl
      const block = value.slice(lineStart, lineEnd)
      const newBlock = block
        .split('\n')
        .map((line) => (line.length > 0 ? prefix + line : prefix.trimEnd()))
        .join('\n')
      const newValue =
        value.slice(0, lineStart) + newBlock + value.slice(lineEnd)
      return {
        value: newValue,
        selStart: lineStart,
        selEnd: lineStart + newBlock.length,
      }
    })
  }

  const insertBlock = (text: string) => {
    applyTransform((value, start, end) => {
      const newValue = value.slice(0, start) + text + value.slice(end)
      const pos = start + text.length
      return { value: newValue, selStart: pos, selEnd: pos }
    })
  }

  const insertLink = () => {
    applyTransform((value, start, end) => {
      const selected = value.slice(start, end) || 'văn bản'
      const insertion = `[${selected}](url)`
      const newValue = value.slice(0, start) + insertion + value.slice(end)
      const urlStart = start + 1 + selected.length + 2
      return {
        value: newValue,
        selStart: urlStart,
        selEnd: urlStart + 3,
      }
    })
  }

  const insertImage = () => {
    applyTransform((value, start, end) => {
      const selected = value.slice(start, end) || 'mô tả ảnh'
      const insertion = `![${selected}](url)`
      const newValue = value.slice(0, start) + insertion + value.slice(end)
      const urlStart = start + 2 + selected.length + 2
      return {
        value: newValue,
        selStart: urlStart,
        selEnd: urlStart + 3,
      }
    })
  }

  const insertCodeBlock = () => {
    applyTransform((value, start, end) => {
      const selected = value.slice(start, end)
      const inner = selected || 'code'
      const newValue =
        value.slice(0, start) +
        '\n```\n' +
        inner +
        '\n```\n' +
        value.slice(end)
      const innerStart = start + 5
      return {
        value: newValue,
        selStart: innerStart,
        selEnd: innerStart + inner.length,
      }
    })
  }

  const handleContentKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return
    const key = e.key.toLowerCase()
    if (key === 'b') {
      e.preventDefault()
      wrap('**', '**', 'đậm')
    } else if (key === 'i') {
      e.preventDefault()
      wrap('*', '*', 'nghiêng')
    } else if (key === 'u') {
      e.preventDefault()
      wrap('<u>', '</u>', 'gạch chân')
    } else if (key === 'k') {
      e.preventDefault()
      insertLink()
    }
  }

  const toggleTag = (id: string) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh quá lớn, tối đa 5 MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/blog/upload-cover', {
        method: 'POST',
        body: fd,
      })
      const json = (await res.json()) as { success?: boolean; url?: string; error?: string }
      if (!res.ok || !json.url) {
        toast.error(json.error ?? 'Upload thất bại')
        return
      }
      setCoverUrl(json.url)
      toast.success('Đã upload ảnh bìa')
    } catch {
      toast.error('Upload thất bại, kiểm tra kết nối')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const fieldErrors =
    state && state.ok === false ? (state.fieldErrors ?? {}) : {}

  return (
    <form action={formAction} className="space-y-6">
      {state && state.ok === false && (
        <div className="card-brutal border-accent-brand p-4">
          <p className="font-display text-sm font-bold uppercase text-accent-brand">
            {state.error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className="block font-display text-[11px] font-bold uppercase tracking-wider text-ink">
            Tiêu đề
          </label>
          <input
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
            required
            maxLength={200}
            className="mt-2 w-full border-[3px] border-ink bg-bg-warm px-4 py-3 font-display text-lg font-bold text-ink focus:outline-none focus:shadow-[5px_5px_0_#c73937]"
            placeholder="Ví dụ: Hoshin Kanri cho SME — bắt đầu từ đâu?"
          />
          {fieldErrors.title && (
            <p className="mt-1 font-body text-xs text-accent-brand">
              {fieldErrors.title}
            </p>
          )}
        </div>
        <div>
          <label className="block font-display text-[11px] font-bold uppercase tracking-wider text-ink">
            Trạng thái
          </label>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className="mt-2 w-full border-[3px] border-ink bg-bg-warm px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-ink focus:outline-none focus:shadow-[5px_5px_0_#c73937]"
          >
            <option value="draft">Draft (nháp)</option>
            <option value="published">Published (đăng)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-display text-[11px] font-bold uppercase tracking-wider text-ink">
          Danh mục
        </label>
        <select
          name="category_id"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-2 w-full border-[3px] border-ink bg-bg-warm px-4 py-3 font-display text-sm font-bold text-ink focus:outline-none focus:shadow-[5px_5px_0_#c73937]"
        >
          <option value="">— Không có danh mục —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {fieldErrors.category_id && (
          <p className="mt-1 font-body text-xs text-accent-brand">
            {fieldErrors.category_id}
          </p>
        )}
        {categories.length === 0 && (
          <p className="mt-1 font-body text-[11px] text-text-3">
            Chưa có danh mục nào. Tạo danh mục tại{' '}
            <a
              href="/admin/blog/categories"
              className="font-semibold text-accent-brand underline"
            >
              /admin/blog/categories
            </a>
            .
          </p>
        )}
      </div>

      <div>
        <label className="block font-display text-[11px] font-bold uppercase tracking-wider text-ink">
          Tags (tuỳ chọn, tối đa 10)
        </label>
        {tagIds.map((id) => (
          <input key={id} type="hidden" name="tag_ids" value={id} />
        ))}
        {tags.length === 0 ? (
          <p className="mt-1 font-body text-[11px] text-text-3">
            Chưa có tag nào. Tạo tag tại{' '}
            <a
              href="/admin/blog/tags"
              className="font-semibold text-accent-brand underline"
            >
              /admin/blog/tags
            </a>
            .
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => {
              const selected = tagIds.includes(t.id)
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={
                    selected
                      ? 'btn-brutal-primary px-3 py-1.5 text-[11px]'
                      : 'btn-brutal-secondary px-3 py-1.5 text-[11px]'
                  }
                  aria-pressed={selected}
                >
                  {selected ? '✓ ' : ''}
                  {t.name}
                </button>
              )
            })}
          </div>
        )}
        {fieldErrors.tag_ids && (
          <p className="mt-1 font-body text-xs text-accent-brand">
            {fieldErrors.tag_ids}
          </p>
        )}
      </div>

      <div>
        <label className="block font-display text-[11px] font-bold uppercase tracking-wider text-ink">
          Slug (URL)
        </label>
        <div className="mt-2 flex items-stretch">
          <span className="flex items-center border-[3px] border-r-0 border-ink bg-bg-muted-warm px-3 font-mono text-sm text-text-2">
            /blog/
          </span>
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugTouched(true)
            }}
            required
            maxLength={80}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="flex-1 border-[3px] border-ink bg-bg-warm px-4 py-3 font-mono text-sm text-ink focus:outline-none focus:shadow-[5px_5px_0_#c73937]"
            placeholder="hoshin-kanri-cho-sme"
          />
        </div>
        {fieldErrors.slug && (
          <p className="mt-1 font-body text-xs text-accent-brand">
            {fieldErrors.slug}
          </p>
        )}
      </div>

      <div>
        <label className="block font-display text-[11px] font-bold uppercase tracking-wider text-ink">
          Tóm tắt
        </label>
        <textarea
          name="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          required
          maxLength={400}
          rows={3}
          className="mt-2 w-full border-[3px] border-ink bg-bg-warm px-4 py-3 font-body text-[15px] text-ink focus:outline-none focus:shadow-[5px_5px_0_#c73937]"
          placeholder="Mô tả ngắn 1-2 câu, hiển thị trên card listing và thẻ meta description."
        />
        <p className="mt-1 font-body text-[11px] text-text-3">
          {excerpt.length}/400 ký tự
        </p>
        {fieldErrors.excerpt && (
          <p className="mt-1 font-body text-xs text-accent-brand">
            {fieldErrors.excerpt}
          </p>
        )}
      </div>

      <div>
        <label className="block font-display text-[11px] font-bold uppercase tracking-wider text-ink">
          Ảnh bìa (tuỳ chọn)
        </label>
        <div className="mt-2 flex items-stretch gap-0">
          <input
            name="cover_url"
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className="flex-1 border-[3px] border-r-0 border-ink bg-bg-warm px-4 py-3 font-mono text-sm text-ink focus:outline-none focus:shadow-[5px_5px_0_#c73937]"
            placeholder="https://... hoặc bấm Upload"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-brutal-primary px-5 py-3 text-xs disabled:opacity-50"
          >
            {uploading ? 'Đang upload…' : 'Upload'}
          </button>
          {coverUrl && (
            <button
              type="button"
              onClick={() => setCoverUrl('')}
              disabled={uploading}
              className="btn-brutal-secondary ml-3 px-4 py-3 text-xs disabled:opacity-50"
            >
              Xoá
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="mt-1 font-body text-[11px] text-text-3">
          PNG, JPG, WEBP hoặc GIF. Tối đa 5 MB.
        </p>
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt="Preview ảnh bìa"
            className="mt-3 aspect-[16/9] w-full max-w-sm object-cover border-[3px] border-ink shadow-[5px_5px_0_#2C2B2B]"
          />
        )}
        {fieldErrors.cover_url && (
          <p className="mt-1 font-body text-xs text-accent-brand">
            {fieldErrors.cover_url}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block font-display text-[11px] font-bold uppercase tracking-wider text-ink">
            Nội dung
          </label>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="font-display text-[11px] font-semibold uppercase tracking-wider text-accent-brand hover:underline"
          >
            {showPreview ? 'Chỉnh sửa' : 'Xem trước'}
          </button>
        </div>
        {showPreview ? (
          <div className="mt-2 min-h-[400px] border-[3px] border-ink bg-bg-warm p-6">
            {content.trim().length > 0 ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="font-body text-text-3">Chưa có nội dung.</p>
            )}
          </div>
        ) : (
          <>
            <div className="mt-2 flex flex-wrap items-stretch gap-1.5 border-[3px] border-b-0 border-ink bg-bg-muted-warm p-2">
              <ToolbarBtn onClick={() => prefixLines('# ')} title="Tiêu đề 1">
                H1
              </ToolbarBtn>
              <ToolbarBtn onClick={() => prefixLines('## ')} title="Tiêu đề 2">
                H2
              </ToolbarBtn>
              <ToolbarBtn onClick={() => prefixLines('### ')} title="Tiêu đề 3">
                H3
              </ToolbarBtn>
              <ToolbarBtn onClick={() => prefixLines('#### ')} title="Tiêu đề 4">
                H4
              </ToolbarBtn>
              <ToolbarDivider />
              <ToolbarBtn
                onClick={() => wrap('**', '**', 'đậm')}
                title="Đậm (Ctrl+B)"
              >
                <span className="font-black">B</span>
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => wrap('*', '*', 'nghiêng')}
                title="Nghiêng (Ctrl+I)"
              >
                <span className="font-bold italic">I</span>
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => wrap('<u>', '</u>', 'gạch chân')}
                title="Gạch chân (Ctrl+U)"
              >
                <span className="font-bold underline underline-offset-2">
                  U
                </span>
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => wrap('~~', '~~', 'gạch ngang')}
                title="Gạch ngang"
              >
                <span className="font-bold line-through">S</span>
              </ToolbarBtn>
              <ToolbarDivider />
              <ToolbarBtn
                onClick={() => prefixLines('- ')}
                title="Danh sách gạch đầu dòng"
              >
                •
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => prefixLines('1. ')}
                title="Danh sách đánh số"
              >
                1.
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => prefixLines('> ')}
                title="Trích dẫn"
              >
                &ldquo;
              </ToolbarBtn>
              <ToolbarDivider />
              <ToolbarBtn
                onClick={() => wrap('`', '`', 'code')}
                title="Code inline"
              >
                &lt;/&gt;
              </ToolbarBtn>
              <ToolbarBtn onClick={insertCodeBlock} title="Khối code">
                {'{ }'}
              </ToolbarBtn>
              <ToolbarDivider />
              <ToolbarBtn onClick={insertLink} title="Liên kết (Ctrl+K)">
                Link
              </ToolbarBtn>
              <ToolbarBtn onClick={insertImage} title="Ảnh">
                IMG
              </ToolbarBtn>
              <ToolbarDivider />
              <ToolbarBtn
                onClick={() => insertBlock('\n\n---\n\n')}
                title="Đường kẻ ngang"
              >
                —
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => insertBlock('\n\n')}
                title="Ngắt đoạn (cách dòng)"
              >
                ¶
              </ToolbarBtn>
            </div>
            <textarea
              ref={textareaRef}
              name="content_md"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleContentKeyDown}
              required
              rows={22}
              className="w-full border-[3px] border-ink bg-bg-warm px-4 py-3 font-mono text-[14px] leading-relaxed text-ink focus:outline-none focus:shadow-[5px_5px_0_#c73937]"
              placeholder={`# Tiêu đề H1\n\nMột đoạn mở đầu...\n\n## Mục lớn\n\n### Mục nhỏ\n\n- Gạch đầu dòng\n- **Đậm**, *nghiêng*, <u>gạch chân</u>\n\n> Trích dẫn\n\nPhím tắt: Ctrl+B đậm • Ctrl+I nghiêng • Ctrl+U gạch chân • Ctrl+K link`}
            />
            <p className="mt-1 font-body text-[11px] text-text-3">
              Bôi đen văn bản rồi bấm nút toolbar hoặc dùng phím tắt. Hỗ trợ
              Markdown và thẻ HTML (vd. <code>&lt;u&gt;</code> cho gạch chân).
            </p>
          </>
        )}
        {showPreview && (
          <input type="hidden" name="content_md" value={content} />
        )}
        {fieldErrors.content_md && (
          <p className="mt-1 font-body text-xs text-accent-brand">
            {fieldErrors.content_md}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t-[3px] border-ink pt-6">
        <Link
          href="/admin/blog"
          className="font-display text-xs font-semibold uppercase tracking-wider text-text-2 hover:text-ink"
        >
          ← Huỷ
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="btn-brutal-primary px-6 py-3 text-sm disabled:opacity-50"
        >
          {pending ? 'Đang lưu…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
