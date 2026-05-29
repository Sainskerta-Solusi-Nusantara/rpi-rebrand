import { cache } from 'react'
import { prisma } from '@/lib/db'

export const NOTIFICATION_CHANNELS = [
  'login_alert',
  'security_event',
  'invitation',
  'marketing',
] as const

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number]

export type NotificationPrefs = {
  emailLoginAlert: boolean
  emailSecurityEvent: boolean
  emailInvitation: boolean
  emailMarketing: boolean
}

export const DEFAULT_PREFS: NotificationPrefs = {
  emailLoginAlert: true,
  emailSecurityEvent: true,
  emailInvitation: true,
  emailMarketing: false,
}

/**
 * Resolve a user's notification preferences. Falls back to DEFAULT_PREFS
 * silently when the row is missing or unreachable so callers can always
 * proceed (and security-critical mails are exempt from this lookup anyway).
 */
export const getNotificationPrefs = cache(
  async (userId: string): Promise<NotificationPrefs> => {
    try {
      const row = await prisma.notificationPref.findUnique({
        where: { userId },
        select: {
          emailLoginAlert: true,
          emailSecurityEvent: true,
          emailInvitation: true,
          emailMarketing: true,
        },
      })
      if (!row) return DEFAULT_PREFS
      return row
    } catch {
      return DEFAULT_PREFS
    }
  },
)

function channelToField(channel: NotificationChannel): keyof NotificationPrefs {
  switch (channel) {
    case 'login_alert':
      return 'emailLoginAlert'
    case 'security_event':
      return 'emailSecurityEvent'
    case 'invitation':
      return 'emailInvitation'
    case 'marketing':
      return 'emailMarketing'
  }
}

/**
 * Check whether the given user wants to receive email for a particular
 * channel. Defaults match DEFAULT_PREFS when the row is missing — i.e. all
 * channels except marketing are opt-out, marketing is opt-in.
 *
 * IMPORTANT: This is for preference-controlled notifications only. Do NOT
 * gate transactional emails (password reset link, email verification,
 * email change confirmation) on this check — those must always send.
 */
export async function shouldSendEmail(
  userId: string,
  channel: NotificationChannel,
): Promise<boolean> {
  const prefs = await getNotificationPrefs(userId)
  return prefs[channelToField(channel)]
}
