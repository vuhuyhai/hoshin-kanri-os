import { z } from 'zod'

// Slug: lowercase kebab-case, 3-80 chars. Used as public URL segment,
// so we keep it ASCII to avoid encoding surprises in OG/share links.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const blogPostSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, 'Slug phải có ít nhất 3 ký tự')
    .max(80, 'Slug tối đa 80 ký tự')
    .regex(SLUG_RE, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'),
  title: z
    .string()
    .trim()
    .min(5, 'Tiêu đề phải có ít nhất 5 ký tự')
    .max(200, 'Tiêu đề tối đa 200 ký tự'),
  excerpt: z
    .string()
    .trim()
    .min(20, 'Tóm tắt phải có ít nhất 20 ký tự')
    .max(400, 'Tóm tắt tối đa 400 ký tự'),
  cover_url: z
    .string()
    .trim()
    .url('URL ảnh bìa không hợp lệ')
    .or(z.literal(''))
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  content_md: z.string().min(50, 'Nội dung phải có ít nhất 50 ký tự'),
  status: z.enum(['draft', 'published']).default('draft'),
})

export type BlogPostInput = z.infer<typeof blogPostSchema>
