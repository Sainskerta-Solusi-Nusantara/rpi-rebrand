'use client'

import * as React from 'react'
import { Avatar } from '@/components/atoms/avatar'
import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import { cn, getInitials } from '@/lib/utils'

export interface TalentEntry {
  id: string
  name: string
  headline: string
  avatarUrl?: string
  matchPercent: number
  skills?: string[]
}

export interface TalentListProps {
  talents: TalentEntry[]
  onInvite?: (id: string) => void
  className?: string
}

export function TalentList({ talents, onInvite, className }: TalentListProps) {
  return (
    <ul className={cn('flex flex-col gap-2', className)}>
      {talents.map((t) => (
        <li
          key={t.id}
          className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-card-foreground hover:border-secondary/50 transition-colors"
        >
          <Avatar src={t.avatarUrl} alt={t.name} fallback={getInitials(t.name)} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{t.name}</p>
              <Badge tone="gold">{t.matchPercent}% cocok</Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">{t.headline}</p>
            {t.skills && t.skills.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {t.skills.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <Button size="sm" variant="outline" onClick={() => onInvite?.(t.id)}>
            Undang
          </Button>
        </li>
      ))}
      {talents.length === 0 ? (
        <li className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Belum ada talenta yang cocok.
        </li>
      ) : null}
    </ul>
  )
}

export default TalentList
