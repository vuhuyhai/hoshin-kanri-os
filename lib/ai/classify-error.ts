import Anthropic from '@anthropic-ai/sdk'

export type AIErrorCode =
  | 'billing'
  | 'rate_limit'
  | 'auth'
  | 'not_found'
  | 'upstream'
  | 'api'
  | 'network'
  | 'unknown'

export interface ClassifiedAIError {
  error: string
  code: AIErrorCode
  status: number
}

export function classifyAIError(
  error: unknown,
  label = 'AI',
): ClassifiedAIError {
  if (error instanceof Anthropic.APIError) {
    const msg = (error.message ?? '').toLowerCase()
    if (msg.includes('credit balance') || msg.includes('billing')) {
      return {
        error: `${label} tạm ngưng (hết credit). Vui lòng báo admin.`,
        code: 'billing',
        status: 503,
      }
    }
    if (error instanceof Anthropic.RateLimitError) {
      return {
        error: `${label} đang quá tải. Thử lại sau 1 phút.`,
        code: 'rate_limit',
        status: 429,
      }
    }
    if (
      error instanceof Anthropic.AuthenticationError ||
      error instanceof Anthropic.PermissionDeniedError
    ) {
      return {
        error: `${label} lỗi xác thực. Liên hệ admin.`,
        code: 'auth',
        status: 502,
      }
    }
    if (error instanceof Anthropic.NotFoundError) {
      return {
        error: `${label} chưa sẵn sàng (model not found). Liên hệ admin.`,
        code: 'not_found',
        status: 502,
      }
    }
    if (error instanceof Anthropic.InternalServerError) {
      return {
        error: `${label} đang gặp sự cố từ nhà cung cấp. Thử lại sau ít phút.`,
        code: 'upstream',
        status: 502,
      }
    }
    return {
      error: `${label} lỗi (${error.status ?? '?'}). Thử lại sau ít phút.`,
      code: 'api',
      status: 502,
    }
  }

  if (
    error instanceof Anthropic.APIConnectionError ||
    error instanceof Anthropic.APIConnectionTimeoutError
  ) {
    return {
      error: `Không kết nối được ${label}. Kiểm tra mạng và thử lại.`,
      code: 'network',
      status: 504,
    }
  }

  return {
    error: `${label} gặp sự cố không xác định. Thử lại sau ít phút.`,
    code: 'unknown',
    status: 500,
  }
}
