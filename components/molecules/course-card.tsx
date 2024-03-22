'use client'

import * as React from 'react'
import Image from 'next/image'
import { Clock, BookOpen, GraduationCap } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/atoms/card'
import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

const levelLabel: Record<CourseLevel, string> = {
  beginner: 'Pemula',
  intermediate: 'Menengah',
  advanced: 'Lanjutan',
}

const levelVariant: Record<CourseLevel, 'success' | 'warning' | 'destructive'> = {
  beginner: 'success',
  intermediate: 'warning',
  advanced: 'destructive',
}

export interface CourseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  instructor: string
  thumbnail?: string | null
  level?: CourseLevel
  durationHours?: number
  lessonsCount?: number
  onStart?: () => void
  startLabel?: string
}

export const CourseCard = React.forwardRef<HTMLDivElement, CourseCardProps>(
  (
    {
      className,
      title,
      instructor,
      thumbnail,
      level,
      durationHours,
      lessonsCount,
      onStart,
      startLabel = 'Mulai',
      ...props
    },
    ref,
  ) => (
    <Card ref={ref} className={cn('flex h-full flex-col overflow-hidden hover:shadow-md', className)} {...props}>
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <GraduationCap className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
        {level && (
          <div className="absolute left-3 top-3">
            <Badge variant={levelVariant[level]} size="sm">
              {levelLabel[level]}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="line-clamp-2 font-heading text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">oleh {instructor}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted-foreground">
          {durationHours != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {durationHours} jam
            </span>
          )}
          {lessonsCount != null && (
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {lessonsCount} pelajaran
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t border-border px-5 py-3">
        <Button type="button" variant="default" size="sm" className="w-full" onClick={onStart}>
          {startLabel}
        </Button>
      </CardFooter>
    </Card>
  ),
)
CourseCard.displayName = 'CourseCard'
