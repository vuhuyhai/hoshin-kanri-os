'use client'

import { useActionState, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type ActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | null

type TagFormAction = (
  prev: ActionState,
  formData: FormData
) => Promise<ActionState>

type TagInitial = { slug: string; name: string }

const EMPTY: TagInitial = { slug: '', name: '' }

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
    .slice(0, 50)
}

export function TagForm({
  action,
  initial = EMPTY,
  submitLabel = 'Tạo tag',
  successMessage = 'Đã lưu tag',
  resetOnSuccess = false,
  compact = false,
}: {
  action: TagFormAction
  initial?: TagInitial
  submitLabel?: string
  successMessage?: string
  resetOnSuccess?: boolean
  compact?: boolean
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData)
      if (result?.ok) {
        toast.success(successMessage)
        router.refresh()
      }
      return result
    },
    null
  )

  const [name, setName] = useState(initial.name)
  const [slug, setSlug] = useState(initial.slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug))

  const fieldErrors =
    state && state.ok === false ? (state.fieldErrors ?? {}) : {}

  if (resetOnSuccess && state?.ok === true && name !== '') {
    setName('')
    setSlug('')
    setSlugTouched(false)
  }

  return (
    <form action={formAction} className={compact ? 'space-y-3' : 'space-y-5'}>
      {state && state.ok === false && (
        <div className="card-brutal border-accent-brand p-3">
          <p className="font-display text-[13px] font-bold uppercase text-accent-brand">
            {state.error}
          </p>
        </div>
      )}

      <div className={compact ? 'grid grid-cols-1 gap-3 md:grid-cols-2' : 'space-y-4'}>
        <div>
          <label className="block font-display text-[11px] font-bold uppercase tracking-wider text-ink">
            Tên tag
          </label>
          <input
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
            required
            maxLength={50}
            className="mt-1.5 w-full border-[3px] border-ink bg-bg-warm px-3 py-2 font-display text-sm font-bold text-ink focus:outline-none focus:shadow-[4px_4px_0_#c73937]"
            placeholder="Ví dụ: OKR"
          />
          {fieldErrors.name && (
            <p className="mt-1 font-body text-xs text-accent-brand">
              {fieldErrors.name}
            </p>
          )}
        </div>
        <div>
          <label className="block font-display text-[11px] font-bold uppercase tracking-wider text-ink">
            Slug
          </label>
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugTouched(true)
            }}
            required
            maxLength={50}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="mt-1.5 w-full border-[3px] border-ink bg-bg-warm px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:shadow-[4px_4px_0_#c73937]"
            placeholder="okr"
          />
          {fieldErrors.slug && (
            <p className="mt-1 font-body text-xs text-accent-brand">
              {fieldErrors.slug}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn-brutal-primary px-5 py-2.5 text-xs disabled:opacity-50"
        >
          {pending ? 'Đang lưu…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
