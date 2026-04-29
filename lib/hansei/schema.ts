import { z } from 'zod'

export const createHanseiSchema = z.object({
  kpi_id: z.string().uuid(),
  week_start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'week_start phải là ISO date YYYY-MM-DD'),
  streak_weeks: z.number().int().min(2),
  why_red: z
    .string()
    .min(30, 'Tại sao đỏ tối thiểu 30 ký tự')
    .max(1000, 'Tối đa 1000 ký tự'),
  next_action: z
    .string()
    .min(30, 'Hành động tiếp theo tối thiểu 30 ký tự')
    .max(1000, 'Tối đa 1000 ký tự'),
})

export type CreateHanseiInput = z.infer<typeof createHanseiSchema>
