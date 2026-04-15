import { z } from 'zod'

// Source tag identifies which surface the subscriber came from
// (e.g. 'blog-post-cta', 'homepage-footer'). Optional — the API
// falls back to 'unknown' if not provided.
export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Email không hợp lệ')
    .max(200, 'Email quá dài'),
  source: z
    .string()
    .trim()
    .max(60, 'Source quá dài')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'unknown')),
})

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>
