'use client'

import * as React from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Logo } from '@/components/atoms/logo'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-provider'

export interface BrandingTokens {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  fontHeading: string
  fontSans: string
  radius: number
  density: 'compact' | 'comfortable' | 'cozy'
  logoUrl?: string | null
  faviconUrl?: string | null
}

export interface BrandingFormProps {
  initial: BrandingTokens
  tenantName?: string
  onSave?: (tokens: BrandingTokens) => Promise<void> | void
  className?: string
}

const FONT_OPTIONS = ['Playfair Display', 'Inter', 'Poppins', 'Lora', 'DM Serif Display']

export function BrandingForm({ initial, tenantName, onSave, className }: BrandingFormProps) {
  const [tokens, setTokens] = React.useState<BrandingTokens>(initial)
  const [saving, setSaving] = React.useState(false)
  const { t } = useI18n()
  const tr = t.formsActions.brandingForm

  const set = <K extends keyof BrandingTokens>(key: K, value: BrandingTokens[K]) =>
    setTokens((t) => ({ ...t, [key]: value }))

  const handleFile = (key: 'logoUrl' | 'faviconUrl') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set(key, typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave?.(tokens)
    } finally {
      setSaving(false)
    }
  }

  const previewStyle = {
    ['--primary' as string]: tokens.primary,
    ['--secondary' as string]: tokens.secondary,
    ['--accent' as string]: tokens.accent,
    ['--background' as string]: tokens.background,
    ['--foreground' as string]: tokens.foreground,
    ['--radius' as string]: `${tokens.radius}px`,
  } as React.CSSProperties

  return (
    <form
      onSubmit={onSubmit}
      className={cn('grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)]', className)}
    >
      <div className="flex flex-col gap-6">
        <fieldset className="rounded-xl border border-border bg-card p-5">
          <legend className="px-2 font-heading">{tr.sectionColors}</legend>
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker label="Primary" value={tokens.primary} onChange={(v) => set('primary', v)} />
            <ColorPicker label="Secondary" value={tokens.secondary} onChange={(v) => set('secondary', v)} />
            <ColorPicker label="Accent" value={tokens.accent} onChange={(v) => set('accent', v)} />
            <ColorPicker label="Background" value={tokens.background} onChange={(v) => set('background', v)} />
            <ColorPicker label="Foreground" value={tokens.foreground} onChange={(v) => set('foreground', v)} />
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-border bg-card p-5">
          <legend className="px-2 font-heading">{tr.sectionTypography}</legend>
          <div className="grid grid-cols-2 gap-4">
            <FontSelect label="Heading" value={tokens.fontHeading} onChange={(v) => set('fontHeading', v)} />
            <FontSelect label="Body" value={tokens.fontSans} onChange={(v) => set('fontSans', v)} />
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-border bg-card p-5">
          <legend className="px-2 font-heading">{tr.sectionLogoFavicon}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileField label="Logo" uploadLabel={tr.uploadFile.replace('{label}', 'logo')} value={tokens.logoUrl ?? undefined} onChange={handleFile('logoUrl')} />
            <FileField label="Favicon" uploadLabel={tr.uploadFile.replace('{label}', 'favicon')} value={tokens.faviconUrl ?? undefined} onChange={handleFile('faviconUrl')} />
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-border bg-card p-5">
          <legend className="px-2 font-heading">{tr.sectionShapeDensity}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block">{tr.radiusLabel.replace('{value}', String(tokens.radius))}</Label>
              <input
                type="range"
                min={0}
                max={24}
                value={tokens.radius}
                onChange={(e) => set('radius', Number(e.target.value))}
                className="w-full accent-[var(--secondary)]"
                aria-label="Radius"
              />
            </div>
            <div>
              <Label className="mb-2 block">{tr.densityLabel}</Label>
              <div role="radiogroup" className="flex flex-wrap gap-2">
                {(['compact', 'comfortable', 'cozy'] as const).map((d) => (
                  <label
                    key={d}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm',
                      tokens.density === d && 'border-secondary bg-secondary/10 text-secondary',
                    )}
                  >
                    <input
                      type="radio"
                      name="density"
                      className="sr-only"
                      checked={tokens.density === d}
                      onChange={() => set('density', d)}
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            {tr.btnSave}
          </Button>
        </div>
      </div>

      <aside
        style={previewStyle}
        className="sticky top-20 h-fit rounded-2xl border border-border bg-background p-1 shadow-lg"
      >
        <div className="rounded-xl bg-background p-5 text-foreground">
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">{tr.previewLabel}</p>
          <div className="flex items-center gap-3">
            <Logo tenantName={tenantName} tenantLogoUrl={tokens.logoUrl ?? undefined} />
          </div>
          <div className="mt-4 rounded-[var(--radius)] bg-primary p-4 text-primary-foreground">
            <p className="font-heading text-xl" style={{ fontFamily: tokens.fontHeading }}>
              {tr.previewGreeting.replace('{name}', tenantName ?? 'Tenant')}
            </p>
            <p className="mt-1 text-sm opacity-80" style={{ fontFamily: tokens.fontSans }}>
              {tr.previewTagline}
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center rounded-[var(--radius)] bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground"
            >
              {tr.previewButton}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Swatch color={tokens.primary} label="Primary" />
            <Swatch color={tokens.secondary} label="Secondary" />
            <Swatch color={tokens.accent} label="Accent" />
          </div>
        </div>
      </aside>
    </form>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-10 w-12 cursor-pointer rounded-md border border-input bg-background"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
      </div>
    </div>
  )
}

function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        aria-label={label}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    </div>
  )
}

function FileField({
  label,
  uploadLabel,
  value,
  onChange,
}: {
  label: string
  uploadLabel: string
  value?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      <label className="flex h-24 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background text-sm text-muted-foreground hover:border-secondary hover:text-secondary">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-16 w-auto object-contain" />
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <span>{uploadLabel}</span>
          </>
        )}
        <input type="file" accept="image/*" onChange={onChange} className="sr-only" />
      </label>
    </div>
  )
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="rounded-md border border-border p-2 text-center">
      <span aria-hidden style={{ background: color }} className="block h-8 w-full rounded" />
      <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}

export default BrandingForm
