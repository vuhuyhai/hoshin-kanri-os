'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { postJson } from '@/lib/http/fetch-json'

const INDUSTRIES = [
  'Fitness',
  'F&B',
  'Dịch vụ B2B',
  'Retail',
  'Giáo dục',
  'Khác',
]

const CITIES = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Khác']

const HEADCOUNTS = [
  { value: '1-10', label: '1 - 10 nhân sự' },
  { value: '10-50', label: '10 - 50 nhân sự' },
  { value: '50-200', label: '50 - 200 nhân sự' },
] as const

const SIMILAR_DEBOUNCE_MS = 600
const SIMILAR_LIST_LIMIT = 5

type SimilarOrg = { name: string; city: string; industry: string }
type CheckSimilarResponse = { hasMatches: boolean; matches: SimilarOrg[] }

export default function SetupOrgPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [headcount, setHeadcount] = useState<string>('10-50')
  const [city, setCity] = useState('Hà Nội')

  const [similarOrgs, setSimilarOrgs] = useState<SimilarOrg[]>([])
  const [checkingSimilar, setCheckingSimilar] = useState(false)
  const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setAcknowledgedDuplicate(false)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    const trimmedName = name.trim()
    const trimmedCity = city.trim()
    if (trimmedName.length < 2 || trimmedCity.length === 0) {
      setSimilarOrgs([])
      setCheckingSimilar(false)
      return
    }

    let cancelled = false
    debounceTimerRef.current = setTimeout(async () => {
      setCheckingSimilar(true)
      try {
        const res = await postJson<CheckSimilarResponse>(
          '/api/orgs/check-similar',
          { name: trimmedName, city: trimmedCity },
        )
        if (cancelled) return
        setSimilarOrgs(res.hasMatches ? res.matches : [])
      } catch {
        if (cancelled) return
        setSimilarOrgs([])
      } finally {
        if (!cancelled) setCheckingSimilar(false)
      }
    }, SIMILAR_DEBOUNCE_MS)

    return () => {
      cancelled = true
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [name, city])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Vui lòng nhập tên công ty')
      return
    }
    if (!industry) {
      toast.error('Vui lòng chọn ngành nghề')
      return
    }
    if (similarOrgs.length > 0 && !acknowledgedDuplicate) {
      toast.error(
        'Đã có công ty trùng tên trong cùng thành phố. Hãy xác nhận trước khi tiếp tục.',
      )
      return
    }

    setIsLoading(true)

    try {
      await postJson('/api/settings/org', { name: name.trim(), industry, headcount, city })
      toast.success(`Chào mừng ${name.trim()}!`)
      router.push('/dashboard')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo công ty. Thử lại.'
      toast.error(msg)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 text-2xl font-bold text-primary">
            Hoshin Kanri OS
          </div>
          <CardTitle className="text-xl">Thiết lập công ty</CardTitle>
          <CardDescription>
            Bước 1/1 — Nhập thông tin công ty để bắt đầu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Tên công ty</Label>
              <Input
                id="name"
                placeholder="VD: Công ty TNHH ABC"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Ngành nghề</Label>
              <Select
                value={industry}
                onValueChange={(v) => v && setIndustry(v)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngành nghề" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quy mô nhân sự</Label>
              <Select
                value={headcount}
                onValueChange={(v) => v && setHeadcount(v)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEADCOUNTS.map((hc) => (
                    <SelectItem key={hc.value} value={hc.value}>
                      {hc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Thành phố</Label>
                {checkingSimilar && (
                  <span
                    role="status"
                    aria-label="Đang kiểm tra..."
                    className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
                  />
                )}
              </div>
              <Select
                value={city}
                onValueChange={(v) => v && setCity(v)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {similarOrgs.length > 0 && (
              <div
                role="alert"
                aria-live="polite"
                className="border-2 border-[var(--accent-yellow)] bg-[var(--accent-yellow)]/10 p-4 rounded-[4px] shadow-[var(--shadow-md)]"
              >
                <p className="font-semibold mb-2">
                  ⚠️ Đã có công ty tương tự trong khu vực
                </p>
                <ul className="space-y-1 text-sm mb-3">
                  {similarOrgs.slice(0, SIMILAR_LIST_LIMIT).map((org, i) => (
                    <li key={`${org.name}-${org.city}-${i}`}>
                      • {org.name} — {org.industry} · {org.city}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mb-3">
                  Nếu bạn làm việc tại một trong các công ty trên, hãy yêu cầu
                  CEO mời bạn thay vì tạo mới.
                </p>
                <label
                  htmlFor="ack-duplicate"
                  className="flex items-start gap-2 cursor-pointer text-sm"
                >
                  <input
                    id="ack-duplicate"
                    type="checkbox"
                    checked={acknowledgedDuplicate}
                    onChange={(e) => setAcknowledgedDuplicate(e.target.checked)}
                    disabled={isLoading}
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span>
                    Tôi xác nhận đây là chi nhánh/công ty khác, không phải công
                    ty đã liệt kê
                  </span>
                </label>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang tạo...' : 'Tạo công ty & bắt đầu'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
