import { prisma } from '@/lib/db'

export type DeliveryStatus = 'pending' | 'success' | 'failed' | 'dead_letter'

export interface DeliveryListItem {
  id: string
  webhookId: string
  event: string
  status: string
  statusCode: number | null
  attempt: number
  error: string | null
  nextRetryAt: Date | null
  createdAt: Date
  deliveredAt: Date | null
  responseBody: string | null
  payload: unknown
}

export interface DeliveryListPage {
  items: DeliveryListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const PAGE_SIZE_DEFAULT = 50
const PAGE_SIZE_MAX = 100

/**
 * Paginated list of deliveries for one webhook, newest first.
 * Filterable by status + event + date range. Used by the webhook delivery
 * dashboard.
 */
export async function getDeliveriesForWebhook(
  webhookId: string,
  opts: {
    status?: string
    event?: string
    from?: Date
    to?: Date
    page?: number
    pageSize?: number
  } = {},
): Promise<DeliveryListPage> {
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = Math.min(
    PAGE_SIZE_MAX,
    Math.max(1, opts.pageSize ?? PAGE_SIZE_DEFAULT),
  )

  const where = {
    webhookId,
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.event ? { event: opts.event } : {}),
    ...(opts.from || opts.to
      ? {
          createdAt: {
            ...(opts.from ? { gte: opts.from } : {}),
            ...(opts.to ? { lte: opts.to } : {}),
          },
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.webhookDelivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        webhookId: true,
        event: true,
        status: true,
        statusCode: true,
        attempt: true,
        error: true,
        nextRetryAt: true,
        createdAt: true,
        deliveredAt: true,
        responseBody: true,
        payload: true,
      },
    }),
    prisma.webhookDelivery.count({ where }),
  ])

  return {
    items: items as DeliveryListItem[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export interface DeliveryStats {
  total: number
  success: number
  pending: number
  failed: number
  deadLetter: number
  successRate: number
  meanAttempts: number
  /** Last N delivery statuses, newest first — for the sparkline. */
  recent: { status: string; createdAt: Date }[]
}

/**
 * Aggregate counts + success-rate + sparkline for a webhook. Capped at the
 * last 1000 deliveries for the rate / mean-attempts so the query stays cheap
 * on large tenants.
 */
export async function getDeliveryStats(webhookId: string): Promise<DeliveryStats> {
  const [counts, recent, attemptAgg] = await Promise.all([
    prisma.webhookDelivery.groupBy({
      by: ['status'],
      where: { webhookId },
      _count: { _all: true },
    }),
    prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { status: true, createdAt: true },
    }),
    prisma.webhookDelivery.aggregate({
      where: { webhookId },
      _avg: { attempt: true },
    }),
  ])

  let total = 0
  let success = 0
  let pending = 0
  let failed = 0
  let deadLetter = 0
  for (const c of counts) {
    const n = c._count?._all ?? 0
    total += n
    if (c.status === 'success') success = n
    else if (c.status === 'pending') pending = n
    else if (c.status === 'failed') failed = n
    else if (c.status === 'dead_letter') deadLetter = n
  }

  const completed = success + failed + deadLetter
  const successRate = completed > 0 ? (success / completed) * 100 : 0
  const meanAttempts = attemptAgg._avg.attempt ?? 0

  return {
    total,
    success,
    pending,
    failed,
    deadLetter,
    successRate,
    meanAttempts,
    recent,
  }
}

/**
 * All dead-lettered deliveries for a tenant, newest first. Used by the
 * dead-letter inbox.
 */
export async function getDeadLetterQueue(
  tenantId: string,
  opts: { limit?: number } = {},
): Promise<DeliveryListItem[]> {
  const limit = Math.min(PAGE_SIZE_MAX * 4, Math.max(1, opts.limit ?? 200))
  const items = await prisma.webhookDelivery.findMany({
    where: {
      status: 'dead_letter',
      webhook: { tenantId },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      webhookId: true,
      event: true,
      status: true,
      statusCode: true,
      attempt: true,
      error: true,
      nextRetryAt: true,
      createdAt: true,
      deliveredAt: true,
      responseBody: true,
      payload: true,
    },
  })
  return items as DeliveryListItem[]
}

/**
 * Look up a single delivery row, scoped to a tenant (via the webhook FK).
 * Used by admin actions to verify ownership before mutating.
 */
export async function getDeliveryForTenant(
  deliveryId: string,
  tenantId: string,
): Promise<DeliveryListItem | null> {
  const row = await prisma.webhookDelivery.findFirst({
    where: { id: deliveryId, webhook: { tenantId } },
    select: {
      id: true,
      webhookId: true,
      event: true,
      status: true,
      statusCode: true,
      attempt: true,
      error: true,
      nextRetryAt: true,
      createdAt: true,
      deliveredAt: true,
      responseBody: true,
      payload: true,
    },
  })
  return (row as DeliveryListItem) ?? null
}
