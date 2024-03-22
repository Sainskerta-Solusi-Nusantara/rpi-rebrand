import * as React from 'react'
import { Quote } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Card, CardContent } from '@/components/atoms/card'
import { cn } from '@/lib/utils'

export interface TestimonialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  quote: React.ReactNode
  name: string
  role?: string
  avatarUrl?: string | null
  company?: string
}

export const TestimonialCard = React.forwardRef<HTMLDivElement, TestimonialCardProps>(
  ({ className, quote, name, role, avatarUrl, company, ...props }, ref) => (
    <Card ref={ref} className={cn('h-full', className)} {...props}>
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <Quote className="h-6 w-6 text-secondary" aria-hidden="true" />
        <blockquote className="flex-1 text-sm leading-relaxed text-foreground md:text-base">
          {quote}
        </blockquote>
        <figcaption className="flex items-center gap-3 border-t border-border pt-4">
          <Avatar src={avatarUrl ?? undefined} name={name} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            {(role || company) && (
              <p className="truncate text-xs text-muted-foreground">
                {role}
                {role && company && ' · '}
                {company}
              </p>
            )}
          </div>
        </figcaption>
      </CardContent>
    </Card>
  ),
)
TestimonialCard.displayName = 'TestimonialCard'
