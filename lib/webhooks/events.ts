/**
 * Catalogue of webhook events emittable by RPI for a tenant subscriber.
 *
 * Keep this list stable & additive: external integrators rely on exact event
 * names to filter their subscriptions. Renaming/removing values is a breaking
 * change. When adding new events, append to the end of the list.
 */
export const WEBHOOK_EVENTS = [
  'tenant.member.added',
  'tenant.member.removed',
  'tenant.member.role_changed',
  'tenant.branding.updated',
  'tenant.api_key.created',
  'tenant.api_key.revoked',
  'tenant.job.created',
  'tenant.job.updated',
  'tenant.job.published',
  'tenant.job.status_changed',
  'tenant.job.deleted',
  'tenant.application.submitted',
  'tenant.application.status_changed',
  'tenant.plan.changed',
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

/** Human-friendly label per event, surfaced in the management UI (id-ID). */
export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  'tenant.member.added': 'Anggota tim ditambahkan',
  'tenant.member.removed': 'Anggota tim dihapus',
  'tenant.member.role_changed': 'Peran anggota tim diubah',
  'tenant.branding.updated': 'Branding tenant diperbarui',
  'tenant.api_key.created': 'API key tenant dibuat',
  'tenant.api_key.revoked': 'API key tenant dicabut',
  'tenant.job.created': 'Lowongan dibuat',
  'tenant.job.updated': 'Lowongan diperbarui',
  'tenant.job.published': 'Lowongan dipublikasikan',
  'tenant.job.status_changed': 'Status lowongan diubah',
  'tenant.job.deleted': 'Lowongan dihapus',
  'tenant.application.submitted': 'Lamaran masuk',
  'tenant.application.status_changed': 'Status lamaran diubah',
  'tenant.plan.changed': 'Paket langganan diubah',
}

/** Type guard – useful when validating data from forms / external input. */
export function isWebhookEvent(value: string): value is WebhookEvent {
  return (WEBHOOK_EVENTS as readonly string[]).includes(value)
}
