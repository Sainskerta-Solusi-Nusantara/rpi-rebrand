import * as React from 'react'
import {
  Activity,
  CheckCircle2,
  FileEdit,
  LogIn,
  LucideIcon,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { cn, formatDateTime, getInitials } from '@/lib/utils'

export type ActivityKind =
  | 'login'
  | 'create'
  | 'update'
  | 'delete'
  | 'invite'
  | 'complete'
  | 'generic'

export interface ActivityEntry {
  id: string
  actor: { name: string; avatarUrl?: string }
  action: string
  target?: string
  kind?: ActivityKind
  time: Date | string | number
  context?: string
}

export interface ActivityTimelineProps {
  entries: ActivityEntry[]
  className?: string
  emptyMessage?: string
}

const ICONS: Record<ActivityKind, LucideIcon> = {
  login: LogIn,
  create: UserPlus,
  update: FileEdit,
  delete: Trash2,
  invite: UserPlus,
  complete: CheckCircle2,
  generic: Activity,
}

export function ActivityTimeline({
  entries,
  className,
  emptyMessage = 'Belum ada aktivitas.',
}: ActivityTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className={cn('rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground', className)}>
        {emptyMessage}
      </p>
    )
  }
  return (
    <ol className={cn('relative space-y-5 pl-6', className)}>
      <span
        aria-hidden
        className="absolute left-[10px] top-2 bottom-2 w-px bg-border"
      />
      {entries.map((e) => {
        const Icon = ICONS[e.kind ?? 'generic']
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-6 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-secondary">
              <Icon className="h-3 w-3" />
            </span>
            <div className="flex items-start gap-3">
              <Avatar
                size="sm"
                src={e.actor.avatarUrl}
                alt={e.actor.name}
                fallback={getInitials(e.actor.name)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{e.actor.name}</span>
                  <span className="text-muted-foreground"> {e.action}</span>
                  {e.target ? <span className="font-medium"> {e.target}</span> : null}
                </p>
                {e.context ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{e.context}</p>
                ) : null}
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {formatDateTime(e.time)}
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default ActivityTimeline
