/**
 * Central catalog of events that trigger Web Push delivery via
 * `dispatchPushToUser`. This file is documentation-as-code: it does NOT
 * gate dispatching at runtime (each call site is responsible for its own
 * preference check, if any). Use it as the single source of truth when
 * adding new push triggers or auditing existing ones.
 *
 * Policy decisions baked in here:
 *
 *  - `gate` is the NotificationChannel that governs the push, or `null`
 *    if the event is treated as "critical/transactional" (e.g. a status
 *    change on someone's job application, or a scheduled interview) and
 *    must be delivered regardless of opt-out. This mirrors the email
 *    policy in `lib/auth/notification-prefs.ts` where transactional
 *    mails (password reset, application status) bypass `shouldSendEmail`.
 *
 *  - `critical: true` is a hard documentation flag — it tells future
 *    maintainers that the event is operationally important enough to
 *    skip the per-channel pref check. Marketing-style events MUST set
 *    `critical: false` and a real `gate` channel.
 *
 *  - `newMessage` is intentionally critical here because:
 *      1. there's no `message` channel in `NotificationPrefs` today, and
 *      2. messages in this app are tied to a live application thread —
 *         missing one effectively means losing a recruiter conversation.
 *    If product later wants finer-grained control, add a new channel
 *    and flip critical:false.
 *
 *  - `loginAlert` shares the same gate (`login_alert`) as the email
 *    counterpart so toggling that pref turns off BOTH delivery channels
 *    at once — what the user expects from a single "login alerts" switch.
 */

import type { NotificationChannel } from '@/lib/auth/notification-prefs'

export type PushEventConfig = {
  /**
   * NotificationChannel that governs whether to send this push, or null
   * when the event is critical (transactional) and bypasses prefs.
   */
  gate: NotificationChannel | null
  /**
   * True when the event is operationally critical and must be delivered
   * even if the user has opted out of related email. Documentation only —
   * runtime behavior is decided by the call site.
   */
  critical: boolean
}

export const PUSH_EVENT_CONFIG = {
  loginAlert: { gate: 'login_alert', critical: false },
  applicationStatus: { gate: null, critical: true },
  newMessage: { gate: null, critical: true },
  interviewScheduled: { gate: null, critical: true },
  interviewCancelled: { gate: null, critical: true },
  interviewUpdated: { gate: null, critical: true },
  moderationResolved: { gate: null, critical: true },
} as const satisfies Record<string, PushEventConfig>

export type PushEventKey = keyof typeof PUSH_EVENT_CONFIG
