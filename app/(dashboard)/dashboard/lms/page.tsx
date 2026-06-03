import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Pembelajaran' }

const statusLabels: Record<string, string> = {
  IN_PROGRESS: 'Sedang Berjalan',
  COMPLETED: 'Selesai',
  EXPIRED: 'Kedaluwarsa',
}

export default async function LMSPage() {
  const t = await getServerT()
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login?callbackUrl=/lms')
  const userId = session.user.id

  const [enrollments, certificates] = await Promise.all([
    prisma.enrollment
      .findMany({
        where: { userId },
        orderBy: { enrolledAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              durationHours: true,
              level: true,
              _count: { select: { modules: true } },
            },
          },
        },
      })
      .catch(() => []),
    prisma.certificate
      .findMany({
        where: { userId },
        orderBy: { issuedAt: 'desc' },
        take: 12,
      })
      .catch(() => []),
  ])

  const inProgress = enrollments.filter((e) => e.status === 'IN_PROGRESS')
  const completed = enrollments.filter((e) => e.status === 'COMPLETED')

  return (
    <div className="p-6 space-y-10">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">{t.pagesDash.lms.heading}</h1>
        <p className="text-muted-foreground mt-1">
          {t.pagesDash.lms.subheading
            .replace('{inProgress}', String(inProgress.length))
            .replace('{completed}', String(completed.length))
            .replace('{certificates}', String(certificates.length))}
        </p>
      </header>

      <section>
        <h2 className="font-heading text-xl mb-4">{t.pagesDash.lms.inProgressSection}</h2>
        {inProgress.length === 0 ? (
          <div className="border-border rounded-xl border p-8 text-center">
            <p className="text-muted-foreground">{t.pagesDash.lms.emptyInProgress}</p>
            <a href="/courses" className="text-primary mt-3 inline-block underline">
              {t.pagesDash.lms.browseCoursesLink}
            </a>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((e) => (
              <li key={e.id} className="border-border rounded-xl border overflow-hidden">
                {e.course.thumbnail ? (
                  <Image
                    src={e.course.thumbnail}
                    alt={e.course.title}
                    className="aspect-video w-full object-cover"
                    width={640}
                    height={360}
                    unoptimized
                  />
                ) : (
                  <div className="bg-muted aspect-video w-full" />
                )}
                <div className="p-4">
                  <div className="font-medium">{e.course.title}</div>
                  <div className="text-muted-foreground mt-1 text-sm">
                    {t.pagesDash.lms.courseMeta
                      .replace('{hours}', String(e.course.durationHours))
                      .replace('{modules}', String(e.course._count.modules))}
                  </div>
                  <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full"
                      style={{ width: `${Math.min(100, e.progress)}%` }}
                    />
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {e.progress}% • {statusLabels[e.status]}
                  </div>
                  <a
                    href={`/courses/${e.course.slug}`}
                    className="text-primary mt-3 inline-block text-sm underline"
                  >
                    {t.pagesDash.lms.continueLink}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-heading text-xl mb-4">{t.pagesDash.lms.completedSection}</h2>
        {completed.length === 0 ? (
          <p className="text-muted-foreground">{t.pagesDash.lms.emptyCompleted}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completed.map((e) => (
              <li key={e.id} className="border-border rounded-xl border p-4">
                <div className="font-medium">{e.course.title}</div>
                <div className="text-muted-foreground mt-1 text-sm">
                  {e.completedAt
                    ? t.pagesDash.lms.completedOn.replace(
                        '{date}',
                        new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(e.completedAt),
                      )
                    : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
