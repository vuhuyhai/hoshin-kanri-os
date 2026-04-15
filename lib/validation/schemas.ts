import { z } from 'zod'

// Zod schemas for API request bodies. Grouped by domain, one source of
// truth per endpoint. Import both the schema (for parseBody in the route)
// and the inferred type (for function signatures) from '@/lib/validation'.
//
// Convention: name = <endpoint>Schema, type = <endpoint>Input.

// ============================================================
// Auth
// ============================================================

// POST /api/auth/register
export const registerSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  full_name: z
    .string()
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .optional(),
  phone: z
    .string()
    .regex(/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ')
    .optional(),
})
export type RegisterInput = z.infer<typeof registerSchema>

// POST /api/auth/forgot-password
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

// ============================================================
// Discovery
// ============================================================

const painPointSchema = z.object({
  id: z.string(),
  text: z.string().trim().min(1, 'Pain point không được để trống'),
})

// POST /api/discovery/pain-mapper
export const painMapperSchema = z.object({
  painPoints: z.array(painPointSchema).min(1, 'Cần ít nhất 1 pain point'),
  orgContext: z.object({
    industry: z.string(),
    city: z.string(),
    orgName: z.string(),
  }),
})
export type PainMapperInput = z.infer<typeof painMapperSchema>

// POST /api/discovery/vision-draft
export const visionDraftSchema = z.object({
  answers: z.record(z.string(), z.string()),
  orgContext: z.object({
    industry: z.string(),
    orgName: z.string(),
    headcount: z.string(),
  }),
})
  .refine(
    (v) => Object.values(v.answers).filter((a) => a.trim().length > 10).length >= 3,
    { message: 'Cần trả lời ít nhất 3 câu hỏi', path: ['answers'] },
  )
export type VisionDraftInput = z.infer<typeof visionDraftSchema>

// ============================================================
// KPI
// ============================================================

// POST /api/kpi/entry
export const kpiEntrySchema = z.object({
  kpiId: z.string().min(1, 'Thiếu kpiId'),
  value: z.number().finite('Value phải là số hợp lệ'),
  note: z.string().optional(),
  periodDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'periodDate phải ở dạng YYYY-MM-DD'),
})
export type KpiEntryInput = z.infer<typeof kpiEntrySchema>

// ============================================================
// SWOT
// ============================================================

// POST /api/swot/synthesis
// Loose envelope validation — coaching_items / evidence_items have
// complex nested shapes built by the coaching flow. Deep validation
// happens inside synthesizeSwot(). Zod only guards the boundary.
export const swotSynthesisSchema = z.object({
  org_id: z.string().min(1, 'Thiếu org_id'),
  coaching_items: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, 'Cần ít nhất 1 coaching item'),
  evidence_items: z.array(z.record(z.string(), z.unknown())),
})
export type SwotSynthesisInput = z.infer<typeof swotSynthesisSchema>

// ============================================================
// X-Matrix
// ============================================================

// POST /api/x-matrix/create
// Envelope-only validation. XMatrixData business rules are checked
// by validateXMatrix() in lib/x-matrix/utils.ts after parse.
export const xMatrixCreateSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  year: z.number().int().min(2020).max(2100),
  orgId: z.string().min(1, 'Thiếu orgId'),
})
export type XMatrixCreateInput = z.infer<typeof xMatrixCreateSchema>
