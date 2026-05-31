import { cache } from 'react'
import { prisma } from '@/lib/db'

export type MyReferralStats = {
  referral: {
    code: string
    uses: number
    createdAt: Date
  } | null
  totalSignups: number
  totalApplied: number
  recent: Array<{
    referredUserName: string | null
    signedUpAt: Date
    appliedJobTitle?: string | null
  }>
  leaderboardRank: number | null
}

export type LeaderboardRow = {
  userId: string
  userName: string | null
  image: string | null
  uses: number
  applied: number
}

/**
 * Return the caller's referral summary: their code (if any), total signups,
 * total signups that already applied to a job, the 10 most recent usages,
 * and their rank within the top-50 leaderboard slice.
 */
export const getMyReferralStats = cache(
  async (userId: string): Promise<MyReferralStats> => {
    try {
      const referral = await prisma.referral.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { id: true, code: true, uses: true, createdAt: true },
      })

      if (!referral) {
        return {
          referral: null,
          totalSignups: 0,
          totalApplied: 0,
          recent: [],
          leaderboardRank: null,
        }
      }

      const [totalSignups, totalApplied, recentUsages] = await Promise.all([
        prisma.referralUsage.count({ where: { referralId: referral.id } }),
        prisma.referralUsage.count({
          where: { referralId: referral.id, appliedJobId: { not: null } },
        }),
        prisma.referralUsage.findMany({
          where: { referralId: referral.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            createdAt: true,
            appliedJobId: true,
            referredUser: { select: { name: true } },
          },
        }),
      ])

      const jobIds = Array.from(
        new Set(
          recentUsages
            .map((u) => u.appliedJobId)
            .filter((id): id is string => Boolean(id)),
        ),
      )
      const jobs =
        jobIds.length > 0
          ? await prisma.job.findMany({
              where: { id: { in: jobIds } },
              select: { id: true, title: true },
            })
          : []
      const jobTitle = new Map(jobs.map((j) => [j.id, j.title]))

      const recent = recentUsages.map((u) => ({
        referredUserName: u.referredUser?.name ?? null,
        signedUpAt: u.createdAt,
        appliedJobTitle: u.appliedJobId
          ? jobTitle.get(u.appliedJobId) ?? null
          : null,
      }))

      // Leaderboard rank — look only at the top 50 to keep the query cheap.
      let leaderboardRank: number | null = null
      try {
        const top = await prisma.referral.findMany({
          where: { uses: { gt: 0 } },
          orderBy: [{ uses: 'desc' }, { createdAt: 'asc' }],
          take: 50,
          select: { id: true, userId: true },
        })
        const idx = top.findIndex((r) => r.id === referral.id)
        leaderboardRank = idx === -1 ? null : idx + 1
      } catch (err) {
        console.error('[getMyReferralStats] leaderboard lookup failed', err)
      }

      return {
        referral: {
          code: referral.code,
          uses: referral.uses,
          createdAt: referral.createdAt,
        },
        totalSignups,
        totalApplied,
        recent,
        leaderboardRank,
      }
    } catch (err) {
      console.error('[getMyReferralStats] failed', err)
      return {
        referral: null,
        totalSignups: 0,
        totalApplied: 0,
        recent: [],
        leaderboardRank: null,
      }
    }
  },
)

/**
 * Top 20 referrers across the platform by `uses`, broken-tie by oldest
 * referral row. Returns the referrer's name + avatar and how many of their
 * referees have already applied to at least one job.
 */
export const getTenantReferralLeaderboard = cache(
  async (): Promise<LeaderboardRow[]> => {
    try {
      const top = await prisma.referral.findMany({
        where: { uses: { gt: 0 } },
        orderBy: [{ uses: 'desc' }, { createdAt: 'asc' }],
        take: 20,
        select: {
          id: true,
          userId: true,
          uses: true,
          user: { select: { name: true, image: true } },
        },
      })
      if (top.length === 0) return []

      const referralIds = top.map((t) => t.id)
      const appliedGroups = await prisma.referralUsage.groupBy({
        by: ['referralId'],
        where: {
          referralId: { in: referralIds },
          appliedJobId: { not: null },
        },
        _count: { _all: true },
      })
      const appliedMap = new Map(
        appliedGroups.map((g) => [g.referralId, g._count._all]),
      )

      return top.map((t) => ({
        userId: t.userId,
        userName: t.user?.name ?? null,
        image: t.user?.image ?? null,
        uses: t.uses,
        applied: appliedMap.get(t.id) ?? 0,
      }))
    } catch (err) {
      console.error('[getTenantReferralLeaderboard] failed', err)
      return []
    }
  },
)
