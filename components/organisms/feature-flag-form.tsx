'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createFlag, updateFlag } from '@/lib/feature-flags/flag-actions'

export type SegmentRuleDraft = {
  attr: string
  op: 'in' | 'equals' | 'starts_with'
  values: string
}

export type EnvironmentsDraft = {
  dev: boolean
  staging: boolean
  prod: boolean
}

export type FeatureFlagFormDefaults = {
  key?: string
  name?: string
  description?: string
  type?: 'boolean' | 'percentage' | 'segment'
  percentage?: number
  segmentRules?: SegmentRuleDraft[]
  environments?: EnvironmentsDraft
}

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

const TYPE_OPTIONS: { value: 'boolean' | 'percentage' | 'segment'; label: string }[] = [
  { value: 'boolean', label: 'Boolean (semua-atau-tidak)' },
  { value: 'percentage', label: 'Persentase (rollout bertahap)' },
  { value: 'segment', label: 'Segment (target spesifik)' },
]

const OP_OPTIONS: { value: 'in' | 'equals' | 'starts_with'; label: string }[] = [
  { value: 'in', label: 'in' },
  { value: 'equals', label: 'equals' },
  { value: 'starts_with', label: 'starts_with' },
]

export function FeatureFlagForm({
  mode,
  flagId,
  defaults,
}: {
  mode: 'create' | 'edit'
  flagId?: string
  defaults?: FeatureFlagFormDefaults
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const [type, setType] = useState<'boolean' | 'percentage' | 'segment'>(
    defaults?.type ?? 'boolean',
  )
  const [percentage, setPercentage] = useState<number>(defaults?.percentage ?? 0)
  const [rules, setRules] = useState<SegmentRuleDraft[]>(
    defaults?.segmentRules?.length
      ? defaults.segmentRules
      : [{ attr: 'tenantId', op: 'in', values: '' }],
  )
  const [environments, setEnvironments] = useState<EnvironmentsDraft>(
    defaults?.environments ?? { dev: true, staging: true, prod: true },
  )

  function addRule() {
    setRules((prev) => [...prev, { attr: '', op: 'in', values: '' }])
  }

  function removeRule(idx: number) {
    setRules((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateRule(idx: number, patch: Partial<SegmentRuleDraft>) {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  function onSubmit(formData: FormData) {
    setError(null)
    setFieldError(null)

    // Serialize JSON fields the server action expects.
    if (type === 'segment') {
      const serialized = rules
        .map((r) => ({
          attr: r.attr.trim(),
          op: r.op,
          values: r.values
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
        }))
        .filter((r) => r.attr.length > 0 && r.values.length > 0)
      formData.set('segmentRules', JSON.stringify(serialized))
    } else {
      formData.set('segmentRules', '')
    }
    formData.set('environments', JSON.stringify(environments))
    formData.set('type', type)
    formData.set('percentage', String(percentage))

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createFlag(formData)
          : await updateFlag(flagId as string, formData)
      if (!result.ok) {
        setError(result.error)
        setFieldError(result.field ?? null)
        return
      }
      if (mode === 'create' && 'data' in result) {
        const created = result.data as { id: string }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/dashboard/feature-flags/${created.id}` as any)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="key" className="block text-sm font-medium">Key</label>
          <input
            id="key"
            name="key"
            type="text"
            required
            maxLength={60}
            defaultValue={defaults?.key ?? ''}
            placeholder="new-onboarding-v2"
            className={inputClass}
            aria-invalid={fieldError === 'key'}
          />
          <p className="text-muted-foreground text-xs">
            Huruf kecil, angka, tanda - atau _. Mulai dengan huruf. Maks 60 karakter.
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">Nama</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={defaults?.name ?? ''}
            className={inputClass}
            aria-invalid={fieldError === 'name'}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">
          Deskripsi
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={500}
          defaultValue={defaults?.description ?? ''}
          className={inputClass}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium">Tipe</legend>
        <div className="grid gap-2 md:grid-cols-3">
          {TYPE_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="border-border bg-background hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <input
                type="radio"
                name="type-radio"
                value={o.value}
                checked={type === o.value}
                onChange={() => setType(o.value)}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {type === 'percentage' && (
        <div className="space-y-2">
          <label htmlFor="percentage" className="block text-sm font-medium">
            Persentase rollout: {percentage}%
          </label>
          <input
            id="percentage"
            type="range"
            min={0}
            max={100}
            step={1}
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-muted-foreground text-xs">
            0% berarti tidak ada yang mendapat; 100% berarti semua mendapat.
          </p>
        </div>
      )}

      {type === 'segment' && (
        <fieldset className="space-y-3">
          <legend className="block text-sm font-medium">Aturan segment (AND)</legend>
          {rules.map((r, idx) => (
            <div
              key={idx}
              className="border-border bg-background grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_140px_2fr_auto]"
            >
              <input
                type="text"
                placeholder="atribut (mis. tenantId)"
                value={r.attr}
                onChange={(e) => updateRule(idx, { attr: e.target.value })}
                className={inputClass}
              />
              <select
                value={r.op}
                onChange={(e) =>
                  updateRule(idx, { op: e.target.value as SegmentRuleDraft['op'] })
                }
                className={inputClass}
              >
                {OP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="nilai (pisahkan dengan koma)"
                value={r.values}
                onChange={(e) => updateRule(idx, { values: e.target.value })}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeRule(idx)}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex h-9 items-center rounded-md border px-3 text-xs font-medium"
                disabled={rules.length <= 1}
              >
                Hapus
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRule}
            className="border-border bg-background hover:bg-muted inline-flex h-9 items-center rounded-md border px-3 text-sm"
          >
            Tambah aturan
          </button>
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium">Lingkungan</legend>
        <div className="flex flex-wrap gap-4">
          {(['dev', 'staging', 'prod'] as const).map((env) => (
            <label key={env} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={environments[env]}
                onChange={(e) =>
                  setEnvironments((prev) => ({ ...prev, [env]: e.target.checked }))
                }
                className="size-4 rounded border-input"
              />
              <span className="capitalize">{env}</span>
            </label>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          Lingkungan yang tidak dicentang akan dikembalikan false oleh evaluator.
        </p>
      </fieldset>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? 'Menyimpan…' : mode === 'create' ? 'Buat flag' : 'Simpan perubahan'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border-border bg-background hover:bg-muted inline-flex h-10 items-center rounded-md border px-4 text-sm"
        >
          Batal
        </button>
      </div>
    </form>
  )
}
