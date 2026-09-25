/**
 * Tra ve duong dan anh da toi uu qua /_next/image (tu doi sang WebP/AVIF, thu nho dung kich thuoc).
 * Anh bia goc tren Supabase nang 1-2MB PNG, qua day con khoang 50-150KB.
 * `w` phai nam trong images.deviceSizes/imageSizes cua Next (640, 1080, 1200...).
 */
export function anhToiUu(url: string, w: 640 | 1080 | 1200 = 1080, q = 75): string {
  if (!url || !/^https:\/\/[a-z0-9]+\.supabase\.co\/storage\//.test(url)) return url
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=${q}`
}
