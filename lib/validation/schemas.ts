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

// ============================================================
// X-Ray
// ============================================================

const VALID_HEADCOUNTS = ['1-10', '10-50', '50-200'] as const

// POST /api/x-ray/score
// Envelope + boundary checks. Deep structural validation of the
// answers map against X_RAY_QUESTIONS happens inside the route.
export const xRayScoreSchema = z.object({
  answers: z
    .record(z.string(), z.number().int().min(1).max(4))
    .refine((m) => Object.keys(m).length > 0, 'Chưa trả lời câu hỏi nào'),
  companyInfo: z.object({
    email: z.string().trim().email('Email không hợp lệ'),
    companyName: z
      .string()
      .trim()
      .min(2, 'Tên công ty phải có ít nhất 2 ký tự')
      .max(200),
    industry: z.string().trim().min(1, 'Thiếu ngành'),
    headcount: z.enum(VALID_HEADCOUNTS),
  }),
})
export type XRayScoreInput = z.infer<typeof xRayScoreSchema>

// ============================================================
// Discovery (synthesis, vision-save)
// ============================================================

// POST /api/discovery/synthesis
// Envelope-only. The heavy lifting — checking swot_analyses,
// coaching data, pain/vision — happens inside the route against
// the DB before calling the AI.
export const discoverySynthesisSchema = z.object({
  orgId: z.string().min(1, 'Thiếu orgId'),
  orgContext: z.object({
    orgName: z.string(),
    industry: z.string(),
    city: z.string(),
    headcount: z.string(),
  }),
  selectedKpis: z
    .array(
      z.object({
        name: z.string(),
        unit: z.string(),
        targetValue: z.number(),
        frequency: z.string(),
      }),
    )
    .optional()
    .default([]),
})
export type DiscoverySynthesisInput = z.infer<typeof discoverySynthesisSchema>

// POST /api/discovery/vision-save
export const visionSaveSchema = z.object({
  answers: z.record(z.string(), z.string()),
  draft: z.record(z.string(), z.unknown()).nullable().optional(),
  finalVision: z.string().trim().min(1, 'Thiếu vision'),
  finalGoals: z.array(z.string().trim().min(1)).min(1, 'Cần ít nhất 1 goal'),
})
export type VisionSaveInput = z.infer<typeof visionSaveSchema>

// ============================================================
// SWOT — coaching flow + drafts
// ============================================================

const coachingMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

// POST /api/swot/coaching
// Envelope-only. The route re-derives tracker state from the
// request and the prompts are built from orgContext + history.
const orgContextSchema = z.object({
  orgId: z.string(),
  orgName: z.string(),
  industry: z.string(),
  city: z.string(),
  headcount: z.string(),
}).passthrough()

export const swotCoachingSchema = z.object({
  messages: z.array(coachingMessageSchema).min(1, 'Cần ít nhất 1 tin nhắn'),
  orgContext: orgContextSchema,
  currentFramework: z.enum(['sw', 'ot']).optional(),
  coachingContext: z.record(z.string(), z.unknown()).optional(),
  coachingTracker: z.record(z.string(), z.unknown()).optional(),
})
export type SwotCoachingInput = z.infer<typeof swotCoachingSchema>

// POST /api/swot/coaching-draft
// Maps to SwotContextInput from lib/swot/coaching-types.ts.
export const swotCoachingDraftSchema = z.object({
  orgName: z.string().trim().min(1, 'Thiếu tên tổ chức'),
  city: z.string().trim().min(1, 'Thiếu thành phố'),
  industry: z.string().trim().min(1, 'Thiếu ngành'),
  headcount: z.string().trim().min(1, 'Thiếu quy mô'),
  topChallenges: z.string().trim().min(1, 'Thiếu thách thức'),
  currentStrengths: z.string().trim().min(1, 'Thiếu điểm mạnh'),
  breakthroughGoal: z.string().trim().min(1, 'Thiếu breakthrough goal'),
  selectedFrameworks: z
    .array(z.enum(['8Ms', '5Forces', 'PESTEL']))
    .min(1, 'Chọn ít nhất 1 framework'),
  selectedElements: z
    .object({
      eightMs: z.array(z.string()).default([]),
      fiveForces: z.array(z.string()).default([]),
      pestel: z.array(z.string()).default([]),
    })
    .optional(),
  xrayContext: z.record(z.string(), z.unknown()).optional(),
})
export type SwotCoachingDraftInput = z.infer<typeof swotCoachingDraftSchema>

// POST /api/swot/suggest-more
export const swotSuggestMoreSchema = z.object({
  quadrant: z.enum(['strengths', 'weaknesses', 'opportunities', 'threats']),
  hint: z.string().default(''),
  existingItems: z.array(z.string()).default([]),
  contextInput: swotCoachingDraftSchema,
})
export type SwotSuggestMoreInput = z.infer<typeof swotSuggestMoreSchema>

// POST /api/swot/context-cards
const frameworkInputSchema = z.object({
  source: z.string(),
  content: z.string(),
}).passthrough()

export const swotContextCardsSchema = z.object({
  summary: z.object({
    strengths: z.array(frameworkInputSchema).default([]),
    weaknesses: z.array(frameworkInputSchema).default([]),
    opportunities: z.array(frameworkInputSchema).default([]),
    threats: z.array(frameworkInputSchema).default([]),
  }),
  orgContext: orgContextSchema,
})
export type SwotContextCardsInput = z.infer<typeof swotContextCardsSchema>

// POST /api/swot/conflict-check
// Draft shape is validated inside the route (quadrant item IDs
// are cross-referenced against the submitted draft) — envelope
// only here.
export const swotConflictCheckSchema = z.object({
  draft: z.object({
    strengths: z.array(z.record(z.string(), z.unknown())).default([]),
    weaknesses: z.array(z.record(z.string(), z.unknown())).default([]),
    opportunities: z.array(z.record(z.string(), z.unknown())).default([]),
    threats: z.array(z.record(z.string(), z.unknown())).default([]),
    generatedAt: z.string().optional(),
    frameworksUsed: z.array(z.string()).optional(),
  }),
})
export type SwotConflictCheckInput = z.infer<typeof swotConflictCheckSchema>

// POST /api/swot/evidence
export const swotEvidenceSchema = z.object({
  items: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, 'Cần ít nhất 1 item'),
  org_id: z.string().min(1, 'Thiếu org_id'),
})
export type SwotEvidenceInput = z.infer<typeof swotEvidenceSchema>

// POST /api/swot/item-evidence
export const swotItemEvidenceSchema = z.object({
  statement: z.string().trim().min(5, 'Statement phải có ít nhất 5 ký tự'),
  quadrant: z.enum(['S', 'W', 'O', 'T']),
  orgContext: z.string().trim().min(1, 'Thiếu bối cảnh doanh nghiệp'),
  analysisId: z.string().optional(),
})
export type SwotItemEvidenceInput = z.infer<typeof swotItemEvidenceSchema>

// POST /api/swot/sync-xmatrix
export const swotSyncXMatrixSchema = z.object({
  analysisId: z.string().min(1, 'Thiếu analysisId'),
})
export type SwotSyncXMatrixInput = z.infer<typeof swotSyncXMatrixSchema>

// ============================================================
// SWOT — factors + strategies CRUD
// ============================================================

const VALID_QUADRANTS = ['S', 'W', 'O', 'T'] as const

// POST /api/swot-analyses/[id]/factors
export const createSwotFactorSchema = z.object({
  content: z.string().trim().min(1, 'Nội dung không được để trống').max(1000),
  quadrant: z.enum(VALID_QUADRANTS),
  source_framework: z.string().trim().nullable().optional(),
  source_ref: z.string().trim().nullable().optional(),
  evidence_text: z.string().trim().nullable().optional(),
  is_key_factor: z.boolean().optional(),
})
export type CreateSwotFactorInput = z.infer<typeof createSwotFactorSchema>

// PATCH /api/swot-analyses/[id]/factors/[factorId]
export const updateSwotFactorSchema = z
  .object({
    content: z.string().trim().min(1).max(1000).optional(),
    evidence_text: z.string().trim().nullable().optional(),
    is_key_factor: z.boolean().optional(),
    quality_score: z.number().int().min(0).max(100).nullable().optional(),
  })
  .refine(
    (v) => Object.keys(v).length > 0,
    'Không có trường nào để cập nhật',
  )
export type UpdateSwotFactorInput = z.infer<typeof updateSwotFactorSchema>

// POST /api/swot-analyses/[id]/strategies/ai-generate
export const generateStrategySchema = z.object({
  sw_factor_ids: z
    .array(z.string().min(1))
    .min(1, 'Cần ít nhất 1 yếu tố S/W'),
  ot_factor_ids: z
    .array(z.string().min(1))
    .min(1, 'Cần ít nhất 1 yếu tố O/T'),
  quadrant: z.enum(['SO', 'WO', 'ST', 'WT']),
})
export type GenerateStrategyInput = z.infer<typeof generateStrategySchema>

// PATCH /api/swot-analyses/[id]/strategies
// Enums must mirror StrategyStatus and BscPerspective in lib/swot/tows-types.ts.
// An earlier iteration used stale values (`consolidated` / `ready_to_sync` /
// `synced` / `financial` / `internal_process` / `learning_growth`) which
// silently 400'd every PATCH from StrategyReviewTable — blocking status
// toggles and BSC saves. If you bump the type, update this enum in the same
// commit.
export const updateStrategySchema = z
  .object({
    id: z.string().min(1, 'Thiếu id chiến lược'),
    status: z
      .enum(['draft', 'approved', 'in_x_matrix', 'rejected'])
      .optional(),
    order_index: z.number().int().optional(),
    bsc_perspective: z
      .enum(['finance', 'customer', 'process', 'learning'])
      .optional(),
  })
  .refine(
    (v) =>
      v.status !== undefined ||
      v.order_index !== undefined ||
      v.bsc_perspective !== undefined,
    'Không có trường nào để cập nhật',
  )
export type UpdateStrategyInput = z.infer<typeof updateStrategySchema>

// ============================================================
// Admin — Hoshin Explorer
// ============================================================

// POST /api/admin/hoshin-explorer
export const hoshinExplorerSchema = z.object({
  conceptId: z.string().min(1, 'Thiếu conceptId'),
  conceptName: z.string().min(1),
  conceptKanji: z.string(),
  conceptDesc: z.string(),
  books: z.string(),
  layer: z.string(),
})
export type HoshinExplorerInput = z.infer<typeof hoshinExplorerSchema>

// ============================================================
// Settings — Org
// ============================================================

// POST /api/settings/org (onboarding — create org)
export const createOrgSchema = z.object({
  name: z.string().trim().min(1, 'Tên công ty không được trống').max(200),
  industry: z.string().trim().min(1, 'Thiếu ngành'),
  headcount: z.enum(VALID_HEADCOUNTS),
  city: z.string().trim().min(1, 'Thiếu thành phố'),
})
export type CreateOrgInput = z.infer<typeof createOrgSchema>

// PATCH /api/settings/org (CEO-only update)
export const updateOrgSchema = z
  .object({
    name: z.string().trim().min(1, 'Tên công ty không được trống').optional(),
    industry: z.string().trim().min(1).optional(),
    headcount: z.enum(VALID_HEADCOUNTS).optional(),
    city: z.string().trim().min(1).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Không có thay đổi')
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>
