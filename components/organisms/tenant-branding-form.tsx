'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateTenantBranding } from '@/lib/tenants/branding-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

type BrandingFields = {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  foregroundColor: string
  ringColor: string
  fontHeading: string
  fontBody: string
  radius: number
  density: string
}

const COLOR_FIELDS: { key: keyof BrandingFields; label: string }[] = [
  { key: 'primaryColor', label: 'Primary' },
  { key: 'secondaryColor', label: 'Secondary' },
  { key: 'accentColor', label: 'Accent' },
  { key: 'backgroundColor', label: 'Background' },
  { key: 'foregroundColor', label: 'Foreground' },
  { key: 'ringColor', label: 'Ring (focus)' },
]

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

type Banner = { kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }

export function TenantBrandingForm({
  tenantSlug,
  initial,
}: {
  tenantSlug: string
  initial: BrandingFields
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsTenantMisc.brandingForm
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })
  const [state, setState] = useState<BrandingFields>(initial)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBanner({ kind: 'idle' })
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await updateTenantBranding({ tenantSlug, values: fd })
      if (!r.ok) {
        setBanner({ kind: 'error', message: r.error })
        return
      }
      setBanner({ kind: 'success' })
      router.refresh()
    })
  }

  function setField<K extends keyof BrandingFields>(key: K, value: BrandingFields[K]) {
    setState((s) => ({ ...s, [key]: value }))
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">{tl.legendColors}</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COLOR_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <label htmlFor={`f-${f.key}`} className="text-muted-foreground text-xs uppercase">
                {f.label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={`${f.label} color picker`}
                  value={state[f.key] as string}
                  onChange={(e) => setField(f.key, e.target.value)}
                  disabled={pending}
                  className="border-border h-10 w-10 cursor-pointer rounded-md border"
                />
                <input
                  id={`f-${f.key}`}
                  name={f.key}
                  type="text"
                  spellCheck={false}
                  value={state[f.key] as string}
                  onChange={(e) => setField(f.key, e.target.value)}
                  disabled={pending}
                  placeholder="#0a2540"
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">{tl.legendTypo}</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="f-fontHeading" className="text-muted-foreground text-xs uppercase">
              {tl.labelFontHeading}
            </label>
            <input
              id="f-fontHeading"
              name="fontHeading"
              type="text"
              value={state.fontHeading}
              onChange={(e) => setField('fontHeading', e.target.value)}
              disabled={pending}
              placeholder="Playfair Display"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="f-fontBody" className="text-muted-foreground text-xs uppercase">
              {tl.labelFontBody}
            </label>
            <input
              id="f-fontBody"
              name="fontBody"
              type="text"
              value={state.fontBody}
              onChange={(e) => setField('fontBody', e.target.value)}
              disabled={pending}
              placeholder="Inter"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="f-radius" className="text-muted-foreground text-xs uppercase">
              {tl.labelRadius}
            </label>
            <input
              id="f-radius"
              name="radius"
              type="number"
              min={0}
              max={40}
              value={state.radius}
              onChange={(e) => setField('radius', Number(e.target.value))}
              disabled={pending}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="f-density" className="text-muted-foreground text-xs uppercase">
              {tl.labelDensity}
            </label>
            <select
              id="f-density"
              name="density"
              value={state.density}
              onChange={(e) => setField('density', e.target.value)}
              disabled={pending}
              className={inputClass}
            >
              <option value="compact">{tl.optionCompact}</option>
              <option value="normal">{tl.optionNormal}</option>
              <option value="comfortable">{tl.optionComfortable}</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">{tl.legendPreview}</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {COLOR_FIELDS.map((f) => (
            <div
              key={f.key}
              className="border-border flex items-center gap-2 rounded-md border bg-background p-3"
            >
              <span
                aria-hidden
                style={{ backgroundColor: state[f.key] as string }}
                className="border-border size-8 rounded-md border"
              />
              <div className="flex-1">
                <div className="text-xs font-medium">{f.label}</div>
                <div className="text-muted-foreground font-mono text-xs">
                  {state[f.key] as string}
                </div>
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {banner.kind === 'success' && (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {tl.successMsg}
        </p>
      )}
      {banner.kind === 'error' && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {banner.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? tl.btnPending : tl.btnSave}
      </button>
    </form>
  )
}
