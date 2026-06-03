'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Trash2, Upload } from 'lucide-react'
import { removeAvatar, uploadAvatar } from '@/lib/auth/avatar-actions'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_BYTES = 5 * 1024 * 1024

export function AvatarUploader({ initialUrl, label }: { initialUrl: string | null; label: string }) {
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
      setError('Ukuran gambar melebihi 5 MB.')
      return
    }
    if (!ACCEPT.split(',').includes(file.type)) {
      setError('Format harus JPEG, PNG, atau WEBP.')
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)

    const fd = new FormData()
    fd.set('file', file)
    startTransition(async () => {
      const r = await uploadAvatar(fd)
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
    if (!window.confirm('Hapus foto profil?')) return
    setError(null)
    startTransition(async () => {
      const r = await removeAvatar()
      if (!r.ok) {
        setError(r.error)
        return
      }
      setPreviewUrl(null)
      router.refresh()
    })
  }

  const initial = (label.trim().slice(0, 1) || '?').toUpperCase()

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="bg-muted relative grid size-20 place-items-center overflow-hidden rounded-full">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Foto profil"
              className="size-full object-cover"
              width={80}
              height={80}
              unoptimized
            />
          ) : (
            <span className="font-heading text-2xl text-foreground">{initial}</span>
          )}
          {pending && (
            <div
              aria-busy="true"
              className="absolute inset-0 grid place-items-center bg-background/60"
            >
              <span className="text-xs">…</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onPickFile}
              disabled={pending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {previewUrl ? (
                <>
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  Ganti foto
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Unggah foto
                </>
              )}
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={onRemove}
                disabled={pending}
                className="border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Hapus
              </button>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            JPEG, PNG, atau WEBP. Maks 5 MB.
          </p>
        </div>
      </div>

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
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}
