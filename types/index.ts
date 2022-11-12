/**
 * Shared, app-wide TypeScript types.
 * Domain-specific types live alongside their feature modules.
 */

/**
 * Mirror of the Prisma `Role` enum.
 * Keep in sync with `prisma/schema.prisma` (owned by Agent 5).
 */
export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  HR: 'HR',
  MANAGER: 'MANAGER',
  WORKER: 'WORKER',
  GUEST: 'GUEST',
} as const

export type Role = (typeof Role)[keyof typeof Role]

/**
 * Standard discriminated-union API response shape.
 */
export type ApiResponse<T> =
  | {
      success: true
      data: T
      message?: string
    }
  | {
      success: false
      error: {
        code: string
        message: string
        details?: Record<string, unknown>
      }
    }

/**
 * Standard paginated payload.
 */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Common query params for paginated list endpoints.
 */
export interface PaginationQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  q?: string
}

/**
 * Helper for `searchParams` and other Next.js param shapes.
 */
export type SearchParams = Record<string, string | string[] | undefined>

/**
 * Utility: make selected keys optional.
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
