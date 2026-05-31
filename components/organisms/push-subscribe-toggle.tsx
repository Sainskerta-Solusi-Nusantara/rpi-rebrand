'use client'

import { useEffect, useState, useTransition } from 'react'
import { Bell, BellOff, Send } from 'lucide-react'
import {
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
} from '@/lib/push/actions'

type Props = {
  initialSubscribed: boolean
}

type Status = 'idle' | 'loading' | 'unsupported' | 'denied' | 'no-vapid'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalized)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/**
 * Toggle button for Web Push subscription on the current browser/device.
 * Handles support detection, permission request, PushManager.subscribe, and
 * mirrors the change in the database via server actions.
 */
export function PushSubscribeToggle({ initialSubscribed }: Props) {
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

  useEffect(() => {
    if (typeof window === 'undefined') return
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    if (!supported) {
      setStatus('unsupported')
      return
    }
    if (!vapidPublicKey) {
      setStatus('no-vapid')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
    }
  }, [vapidPublicKey])

  async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null
    const existing = await navigator.serviceWorker.getRegistration('/sw.js')
    if (existing) return existing
    try {
      return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    } catch {
      return null
    }
  }

  async function handleEnable() {
    setError(null)
    setMessage(null)
    if (status === 'unsupported') {
      setError('Browser Anda tidak mendukung notifikasi push.')
      return
    }
    if (!vapidPublicKey) {
      setError(
        'Notifikasi push belum dikonfigurasi (VAPID public key tidak tersedia).',
      )
      return
    }

    setStatus('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        setError(
          'Izin notifikasi ditolak. Aktifkan melalui pengaturan situs di browser Anda.',
        )
        return
      }

      const reg = await getRegistration()
      if (!reg) {
        setError('Service worker tidak dapat didaftarkan.')
        setStatus('idle')
        return
      }

      let subscription = await reg.pushManager.getSubscription()
      if (!subscription) {
        // Some TS lib.dom revisions narrow applicationServerKey to
        // BufferSource; Uint8Array is a valid BufferSource at runtime.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const appServerKey = urlBase64ToUint8Array(vapidPublicKey) as any
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        })
      }

      const json = subscription.toJSON()
      const endpoint = json.endpoint
      const keys = json.keys
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        setError('Subscription tidak lengkap. Coba lagi.')
        setStatus('idle')
        return
      }

      startTransition(async () => {
        const result = await subscribeToPush({
          endpoint,
          keys: { p256dh: keys.p256dh!, auth: keys.auth! },
          userAgent: navigator.userAgent,
        })
        if (!result.ok) {
          setError(result.error)
          setStatus('idle')
          return
        }
        setSubscribed(true)
        setStatus('idle')
        setMessage('Notifikasi push diaktifkan di perangkat ini.')
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[push] enable failed', err)
      setError('Terjadi kesalahan saat mengaktifkan notifikasi.')
      setStatus('idle')
    }
  }

  async function handleDisable() {
    setError(null)
    setMessage(null)
    setStatus('loading')
    try {
      const reg = await getRegistration()
      const subscription = reg ? await reg.pushManager.getSubscription() : null
      const endpoint = subscription?.endpoint ?? null

      if (subscription) {
        try {
          await subscription.unsubscribe()
        } catch {
          /* non-fatal */
        }
      }

      if (endpoint) {
        startTransition(async () => {
          const result = await unsubscribeFromPush({ endpoint })
          if (!result.ok) {
            setError(result.error)
            setStatus('idle')
            return
          }
          setSubscribed(false)
          setStatus('idle')
          setMessage('Notifikasi push dinonaktifkan di perangkat ini.')
        })
      } else {
        setSubscribed(false)
        setStatus('idle')
        setMessage('Notifikasi push dinonaktifkan di perangkat ini.')
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[push] disable failed', err)
      setError('Terjadi kesalahan saat menonaktifkan notifikasi.')
      setStatus('idle')
    }
  }

  function handleTest() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await sendTestPush()
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMessage(
        `Tes dikirim — berhasil ${result.sent}, gagal ${result.failed}, dibersihkan ${result.pruned} dari total ${result.total} langganan.`,
      )
    })
  }

  const busy = isPending || status === 'loading'

  if (status === 'unsupported') {
    return (
      <div className="rounded-md border border-input bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Browser Anda tidak mendukung notifikasi push. Coba gunakan Chrome,
        Edge, atau Firefox versi terbaru.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {subscribed ? (
          <button
            type="button"
            onClick={handleDisable}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BellOff className="h-4 w-4" aria-hidden="true" />
            {busy ? 'Memproses…' : 'Nonaktifkan notifikasi push'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy || status === 'denied' || status === 'no-vapid'}
            className="inline-flex items-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {busy ? 'Memproses…' : 'Aktifkan notifikasi push'}
          </button>
        )}

        {subscribed && (
          <button
            type="button"
            onClick={handleTest}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Kirim notifikasi tes
          </button>
        )}
      </div>

      {status === 'denied' && (
        <p className="text-xs text-destructive">
          Izin notifikasi ditolak di browser ini. Buka pengaturan situs lalu
          ubah izin notifikasi ke &ldquo;Allow&rdquo;.
        </p>
      )}
      {status === 'no-vapid' && (
        <p className="text-xs text-muted-foreground">
          Notifikasi push belum dikonfigurasi oleh admin (VAPID public key
          kosong).
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      )}
    </div>
  )
}
