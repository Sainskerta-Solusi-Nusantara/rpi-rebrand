'use client'

import * as React from 'react'
import { Bookmark, MapPin, Building2 } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/atoms/card'
import { Badge } from '@/components/atoms/badge'
import { Chip } from '@/components/atoms/chip'
import { Tag } from '@/components/atoms/tag'
import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { cn, formatRupiah } from '@/lib/utils'

export type LocationType = 'onsite' | 'hybrid' | 'remote'
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance'

const locationTypeLabel: Record<LocationType, string> = {
  onsite: 'On-site',
  hybrid: 'Hybrid',
  remote: 'Remote',
}

const employmentTypeLabel: Record<EmploymentType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Kontrak',
  internship: 'Magang',
  freelance: 'Freelance',
}

export interface JobCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  company: string
  companyLogo?: string | null
  location: string
  locationType?: LocationType
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string
  employmentType?: EmploymentType
  tags?: string[]
  postedAt?: string
  saved?: boolean
  href?: string
  onSave?: () => void
  onApply?: () => void
  saveLabel?: string
  applyLabel?: string
}

function formatSalaryRange(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) return `${formatRupiah(min)} – ${formatRupiah(max)}`
  if (min != null) return `Mulai ${formatRupiah(min)}`
  if (max != null) return `Hingga ${formatRupiah(max)}`
  return null
}

export const JobCard = React.forwardRef<HTMLDivElement, JobCardProps>(
  (
    {
      className,
      title,
      company,
      companyLogo,
      location,
      locationType,
      salaryMin,
      salaryMax,
      employmentType,
      tags,
      postedAt,
      saved,
      onSave,
      onApply,
      saveLabel = 'Simpan',
      applyLabel = 'Lamar',
      ...props
    },
    ref,
  ) => {
    const salary = formatSalaryRange(salaryMin, salaryMax)
    return (
      <Card ref={ref} className={cn('flex h-full flex-col hover:shadow-md', className)} {...props}>
        <CardContent className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start gap-3">
            <Avatar src={companyLogo ?? undefined} name={company} size="md" alt={`${company} logo`} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-heading text-base font-semibold text-foreground">{title}</h3>
              <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{company}</span>
              </p>
            </div>
            {employmentType && (
              <Badge variant="secondary" size="sm">
                {employmentTypeLabel[employmentType]}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {location}
            </span>
            {locationType && <Chip variant="default" removable={false}>{locationTypeLabel[locationType]}</Chip>}
          </div>

          {salary && (
            <p className="text-sm font-semibold text-foreground">
              {salary}
              <span className="ml-1 text-xs font-normal text-muted-foreground">/bulan</span>
            </p>
          )}

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.slice(0, 5).map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
          <span className="text-xs text-muted-foreground">{postedAt ?? ''}</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSave}
              aria-pressed={saved}
              aria-label={saveLabel}
            >
              <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} aria-hidden="true" />
              {saveLabel}
            </Button>
            <Button type="button" variant="default" size="sm" onClick={onApply}>
              {applyLabel}
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  },
)
JobCard.displayName = 'JobCard'
