import { AtSign } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { getRecentMentionsForUser } from '@/lib/applications/note-queries'
import {
  MentionsInbox,
  type MentionInboxRow,
} from '@/components/organisms/mentions-inbox'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Mention saya — Dasbor' }

export default async function MentionsPage() {
  const session = await requireAuth('/dashboard/mentions')
  const t = await getServerT()

  const raw = await getRecentMentionsForUser(session.user.id, 50)

  const rows: MentionInboxRow[] = raw.map((m) => ({
    id: m.id,
    notifiedAt: m.notifiedAt,
    createdAt: m.createdAt,
    noteId: m.note.id,
    noteBody: m.note.body,
    authorName:
      m.note.author.name ?? m.note.author.email ?? t.dashboard.mentions.teamMemberFallback,
    applicationId: m.note.application.id,
    candidateName:
      m.note.application.user.name ??
      m.note.application.user.email ??
      t.dashboard.mentions.candidateFallback,
    jobTitle: m.note.application.job.title,
    tenantSlug: m.note.application.tenant.slug,
    tenantName: m.note.application.tenant.name,
  }))

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <header className="flex items-center gap-2">
        <AtSign className="h-6 w-6" aria-hidden="true" />
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.mentions.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.dashboard.mentions.subtitle}
          </p>
        </div>
      </header>

      <MentionsInbox initial={rows} />
    </div>
  )
}
