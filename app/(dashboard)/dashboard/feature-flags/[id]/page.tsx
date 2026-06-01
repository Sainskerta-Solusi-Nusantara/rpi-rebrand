import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Flag } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { getFlagById } from '@/lib/feature-flags/flag-queries'
import {
  FeatureFlagForm,
  type SegmentRuleDraft,
  type EnvironmentsDraft,
} from '@/components/organisms/feature-flag-form'
import { FeatureFlagOverridesTable } from '@/components/organisms/feature-flag-overrides-table'
import {
  FlagToggleSwitch,
  FlagDeleteButton,
} from '@/components/organisms/feature-flag-controls'

export const metadata = { title: 'Edit Feature Flag — Dasbor' }

function toSegmentDrafts(raw: unknown): SegmentRuleDraft[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: SegmentRuleDraft[] = []
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue
    const rec = r as Record<string, unknown>
    const attr = typeof rec.attr === 'string' ? rec.attr : ''
    const op = rec.op
    const values = rec.values
    if (op !== 'in' && op !== 'equals' && op !== 'starts_with') continue
    const valuesStr = Array.isArray(values) ? values.map((v) => String(v)).join(',') : ''
    out.push({ attr, op, values: valuesStr })
  }
  return out.length ? out : undefined
}

function toEnvironmentsDraft(raw: unknown): EnvironmentsDraft | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const rec = raw as Record<string, unknown>
  return {
    dev: rec.dev !== false,
    staging: rec.staging !== false,
    prod: rec.prod !== false,
  }
}

export default async function EditFeatureFlagPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await requireAuth(`/dashboard/feature-flags/${params.id}`)
  if (session.user.globalRole !== 'SUPERADMIN') {
    notFound()
  }

  const flag = await getFlagById(params.id)
  if (!flag) {
    notFound()
  }

  const validType =
    flag.type === 'boolean' || flag.type === 'percentage' || flag.type === 'segment'
      ? flag.type
      : 'boolean'

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard/feature-flags' as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flag className="h-6 w-6" aria-hidden="true" />
            <h1 className="font-heading text-2xl md:text-3xl">{flag.name}</h1>
          </div>
          <p className="text-muted-foreground mt-1 font-mono text-xs">{flag.key}</p>
        </div>
        <div className="flex items-center gap-4">
          <FlagToggleSwitch id={flag.id} initialEnabled={flag.enabled} />
          <FlagDeleteButton id={flag.id} label="Hapus flag" />
        </div>
      </header>

      <section
        aria-label="Konfigurasi flag"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">Konfigurasi</h2>
        <FeatureFlagForm
          mode="edit"
          flagId={flag.id}
          defaults={{
            key: flag.key,
            name: flag.name,
            description: flag.description ?? '',
            type: validType,
            percentage: flag.percentage,
            segmentRules: toSegmentDrafts(flag.segmentRules),
            environments: toEnvironmentsDraft(flag.environments),
          }}
        />
      </section>

      <section
        aria-label="Override"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">
          Override ({flag.overrideCount})
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Override mengganti hasil evaluasi untuk pengguna atau tenant tertentu — tetapi
          kill-switch (status nonaktif) selalu mengalahkan override.
        </p>
        <FeatureFlagOverridesTable
          flagId={flag.id}
          overrides={flag.overrides.map((o) => ({
            id: o.id,
            userId: o.userId,
            tenantId: o.tenantId,
            value: o.value,
            reason: o.reason,
            user: o.user,
            tenant: o.tenant,
            createdAt: o.createdAt,
          }))}
        />
      </section>
    </div>
  )
}
