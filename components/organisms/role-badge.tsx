import * as React from 'react'
import { cn } from '@/lib/utils'

export type RoleBadgeRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'PARTNER'
  | 'USER'
  | 'OWNER'
  | 'RECRUITER'
  | 'MEMBER'

export interface RoleBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  role: RoleBadgeRole
  label?: string
}

const VARIANT: Record<RoleBadgeRole, { label: string; classes: string }> = {
  SUPERADMIN: {
    label: 'Superadmin',
    classes: 'bg-secondary/15 text-secondary border-secondary/30',
  },
  ADMIN: {
    label: 'Admin',
    classes: 'bg-accent/15 text-accent border-accent/30',
  },
  PARTNER: {
    label: 'Partner',
    classes: 'bg-primary/15 text-primary border-primary/30',
  },
  USER: {
    label: 'Pengguna',
    classes: 'bg-muted text-muted-foreground border-border',
  },
  OWNER: {
    label: 'Pemilik',
    classes: 'bg-secondary/15 text-secondary border-secondary/30',
  },
  RECRUITER: {
    label: 'Recruiter',
    classes: 'bg-accent/15 text-accent border-accent/30',
  },
  MEMBER: {
    label: 'Anggota',
    classes: 'bg-muted text-muted-foreground border-border',
  },
}

export function RoleBadge({ role, label, className, ...rest }: RoleBadgeProps) {
  const v = VARIANT[role]
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        v.classes,
        className,
      )}
    >
      {label ?? v.label}
    </span>
  )
}

export default RoleBadge
