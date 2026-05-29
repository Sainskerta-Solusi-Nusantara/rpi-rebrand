'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Upload } from 'lucide-react'
import {
  removeTenantLogo,
  uploadTenantLogo,
} from '@/lib/tenants/branding-actions'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml'
const MAX_BYTES = 2 * 1024 * 1024

type Slot = 'light' | 'dark' | 'favicon'

export function TenantLogoUploader({
  tenantSlug,
  slot,
  label,
  helpText,
  initialUrl,
  previewBg = 'bg-white',
}: {
  tenantSlug: string
  slot: Slot
  label: string
  helpText: string
  initialUrl: string | null
  previewBg?: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onPickFile() {
    setError(null)
    inputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError('Ukuran gambar melebihi 2 MB.')
      return
    }
    if (!ACCEPT.split(',').includes(file.type)) {
      setError('Format harus PNG, JPEG, WEBP, atau SVG.')
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)

    const fd = new FormData()
    fd.set('tenantSlug', tenantSlug)
    fd.set('slot', slot)
    fd.set('file', file)
    startTransition(async () => {
      const r = await uploadTenantLogo(fd)
      if (!r.ok) {
        setError(r.error)
        setPreviewUrl(initialUrl)
        return
      }
      if (r.data?.url) setPreviewUrl(r.data.url)
      router.refresh()
    })
  }

  function onRemove() {
    if (!previewUrl) return
    if (!window.confirm(`Hapus ${label}?`)) return
    setError(null)
    startTransition(async () => {
      const r = await removeTenantLogo({ tenantSlug, slot })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setPreviewUrl(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className={`border-border flex h-24 items-center justify-center rounded-md border ${previewBg}`}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={label}
            className="max-h-full max-w-[80%] object-contain"
          />
        ) : (
          <span className="text-muted-foreground text-xs">Belum ada gambar</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPickFile}
          disabled={pending}
          className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          {pending ? 'Mengunggah…' : previewUrl ? 'Ganti' : 'Unggah'}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={onRemove}
            disabled={pending}
            className="text-destructive inline-flex items-center gap-1 text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            Hapus
          </button>
        )}
      </div>
      <p className="text-muted-foreground text-xs">{helpText}</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onFileChange}
        className="hidden"
        disabled={pending}
      />
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}
