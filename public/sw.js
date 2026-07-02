/* eslint-disable */
/**
 * SSN Service Worker — minimal Web Push handler.
 *
 * No caching/offline strategy is implemented yet; this worker exists solely to
 * deliver Web Push notifications. It is intentionally pure JS so it requires
 * no build step and can be served as a static asset from /public.
 *
 * Lifecycle:
 *   - install: skipWaiting so the new worker activates immediately
 *   - activate: claim all clients
 *   - push: parse JSON payload {title, body, url?, icon?, badge?, tag?, data?}
 *           and call showNotification.
 *   - notificationclick: focus an existing client at data.url or open one.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = {}
  if (event.data) {
    try {
      payload = event.data.json()
    } catch (err) {
      try {
        payload = { title: 'SSN', body: event.data.text() }
      } catch (_) {
        payload = { title: 'SSN', body: 'Anda memiliki notifikasi baru.' }
      }
    }
  }

  const title = payload.title || 'SSN Pekerja'
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || undefined,
    data: {
      url: payload.url || '/dashboard',
      ...(payload.data || {}),
    },
    actions: payload.actions || [],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/dashboard'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          try {
            const clientUrl = new URL(client.url)
            const targetParsed = new URL(targetUrl, self.location.origin)
            if (clientUrl.origin === targetParsed.origin && 'focus' in client) {
              client.navigate(targetParsed.href).catch(() => {})
              return client.focus()
            }
          } catch (_) {
            /* ignore parse errors */
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl)
        }
        return undefined
      }),
  )
})
