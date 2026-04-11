'use client'

import { useState } from 'react'
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

export default function SetupOrgPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [headcount, setHeadcount] = useState<string>('10-50')
  const [city, setCity] = useState('Hà Nội')

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

    setIsLoading(true)

    try {
      const res = await fetch('/api/settings/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), industry, headcount, city }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Không thể tạo công ty. Thử lại.')
        setIsLoading(false)
        return
      }

      toast.success(`Chào mừng ${name.trim()}!`)
      router.push('/dashboard')
    } catch {
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
      setIsLoading(false)
      return
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
              <Label>Thành phố</Label>
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang tạo...' : 'Tạo công ty & bắt đầu'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
