'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { postJson, FetchJsonError } from '@/lib/http/fetch-json'

type Response = {
  success: true
  status: 'created' | 'already' | 'reactivated'
  message: string
}

type Props = {
  source?: string
}

export function NewsletterCta({ source = 'blog-post-cta' }: Props) {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending || done) return
    const value = email.trim()
    if (value.length < 5) {
      toast.error('Nhập email của bạn nhé')
      return
    }
    setPending(true)
    try {
      const result = await postJson<Response>('/api/newsletter/subscribe', {
        email: value,
        source,
      })
      toast.success(result.message)
      setEmail('')
      setDone(true)
    } catch (err) {
      if (err instanceof FetchJsonError) {
        toast.error(err.message)
      } else {
        toast.error('Không gửi được. Thử lại sau nhé.')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="card-brutal bg-bg-muted-warm p-8 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-wider text-text-3">
        Nhận bài mới qua email
      </p>
      <h3 className="mt-3 font-display text-2xl font-black uppercase text-ink">
        Đăng ký <span className="text-accent-brand">newsletter</span>
      </h3>
      <p className="mt-3 font-body text-text-2">
        Mỗi khi có bài mới về Hoshin Kanri, OKR, X-Matrix, SWOT — bạn sẽ
        nhận email đầu tiên. Không spam, không quảng cáo.
      </p>

      {done ? (
        <div className="mt-6 border-[3px] border-ink bg-bg-warm p-4">
          <p className="font-display text-sm font-bold uppercase text-accent-brand">
            ✓ Đã đăng ký
          </p>
          <p className="mt-1 font-body text-[13px] text-text-2">
            Cảm ơn bạn. Hẹn ở bài mới.
          </p>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="mx-auto mt-6 flex max-w-md items-stretch gap-0"
          aria-label="Đăng ký newsletter"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@cua-ban.com"
            required
            maxLength={200}
            className="flex-1 border-[3px] border-r-0 border-ink bg-bg-warm px-4 py-3 font-body text-[15px] text-ink placeholder:text-text-3 focus:outline-none focus:shadow-[5px_5px_0_#c73937]"
          />
          <button
            type="submit"
            disabled={pending}
            className="btn-brutal-primary px-6 py-3 text-xs disabled:opacity-50"
          >
            {pending ? 'Đang gửi…' : 'Đăng ký'}
          </button>
        </form>
      )}
    </div>
  )
}
