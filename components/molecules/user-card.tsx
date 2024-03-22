import * as React from 'react'
import { MapPin } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Card, CardContent } from '@/components/atoms/card'
import { cn } from '@/lib/utils'

export interface UserCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  role?: string
  headline?: string
  location?: string
  avatarUrl?: string | null
  action?: React.ReactNode
}

export const UserCard = React.forwardRef<HTMLDivElement, UserCardProps>(
  ({ className, name, role, headline, location, avatarUrl, action, ...props }, ref) => (
    <Card ref={ref} className={cn(className)} {...props}>
      <CardContent className="flex items-start gap-3 p-4">
        <Avatar src={avatarUrl ?? undefined} name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-heading text-sm font-semibold text-foreground">{name}</p>
            {role && <span className="shrink-0 text-xs font-medium text-primary">{role}</span>}
          </div>
          {headline && <p className="line-clamp-2 text-xs text-muted-foreground">{headline}</p>}
          {location && (
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {location}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardContent>
    </Card>
  ),
)
UserCard.displayName = 'UserCard'
