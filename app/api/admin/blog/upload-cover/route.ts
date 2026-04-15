import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const BUCKET = 'blog-covers'

export async function POST(request: NextRequest) {
  // Defence-in-depth: middleware already gates /admin, but uploads
  // bypass server actions so we re-verify super-admin here.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_super_admin) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Dữ liệu upload không hợp lệ' },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Thiếu file ảnh' },
      { status: 400 }
    )
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File rỗng' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File quá lớn, tối đa 5 MB' },
      { status: 400 }
    )
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: 'Chỉ chấp nhận PNG, JPG, WEBP, GIF' },
      { status: 400 }
    )
  }

  const ext = EXT_BY_MIME[file.type] ?? 'bin'
  const random = randomBytes(8).toString('hex')
  const path = `${new Date().getFullYear()}/${Date.now()}-${random}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    })
  if (uploadErr) {
    console.error('[api/admin/blog/upload-cover] upload failed:', uploadErr)
    return NextResponse.json(
      { error: uploadErr.message ?? 'Upload thất bại' },
      { status: 500 }
    )
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ success: true, url: publicUrl, path })
}
