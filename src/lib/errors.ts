/** Standard error codes used across all /api/* routes */
export const ERROR_CODES = {
  INVALID_PARAMS:       'INVALID_PARAMS',
  UNAUTHORIZED:         'UNAUTHORIZED',
  RATE_LIMITED:         'RATE_LIMITED',
  NOT_FOUND:            'NOT_FOUND',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  INSUFFICIENT_DATA:    'INSUFFICIENT_DATA',
  INTERNAL:             'INTERNAL',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

export function apiError(
  message: string,
  status: number,
  code?: ErrorCode,
): Response {
  return Response.json(
    { error: message, ...(code ? { code } : {}) },
    { status },
  )
}
