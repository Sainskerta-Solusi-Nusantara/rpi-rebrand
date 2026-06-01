import { StickyNote, Pin } from 'lucide-react'
import {
  getNotesForApplication,
  type NoteRow,
} from '@/lib/applications/note-queries'
import {
  renderMentionsToHtml,
  type KnownUserLookup,
} from '@/lib/applications/mention-parser'
import { NotesComposer, type TenantMember } from './notes-composer'
import { NoteActionsMenu } from './note-actions-menu'
import { NoteReplyToggle } from './note-reply-toggle'

export interface ApplicationNotesSectionProps {
  applicationId: string
  currentUserId: string
  /** Whether the viewer can pin (typically recruiter+ on the tenant). */
  canPin: boolean
  /** Whether the viewer can delete anyone's note (tenant admin). */
  canModerate: boolean
  tenantMembers: TenantMember[]
}

const EDIT_WINDOW_MS = 15 * 60 * 1000

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'baru saja'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} menit lalu`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} jam lalu`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} hari lalu`
  return dateFmt.format(d)
}

function NoteItem({
  note,
  applicationId,
  currentUserId,
  canPin,
  canModerate,
  tenantMembers,
  knownUsers,
  depth = 0,
}: {
  note: NoteRow
  applicationId: string
  currentUserId: string
  canPin: boolean
  canModerate: boolean
  tenantMembers: TenantMember[]
  knownUsers: KnownUserLookup
  depth?: number
}) {
  const isAuthor = note.authorId === currentUserId
  const withinEditWindow =
    Date.now() - note.createdAt.getTime() < EDIT_WINDOW_MS
  const canEdit = isAuthor && withinEditWindow
  const canDelete = isAuthor || canModerate
  const isTopLevel = note.parentNoteId === null
  const html = renderMentionsToHtml(note.body, knownUsers)

  const authorName =
    note.author.name ?? note.author.email ?? 'Anggota tim'
  const initial = authorName.trim().charAt(0).toUpperCase() || '?'

  return (
    <li
      id={`note-${note.id}`}
      className={
        note.pinned && isTopLevel
          ? 'border-amber-300 bg-amber-50/60 rounded-lg border p-3'
          : 'rounded-lg p-3'
      }
    >
      <div className="flex items-start gap-3">
        {note.author.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={note.author.image}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="bg-muted text-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-medium">{authorName}</span>
            <span
              className="text-muted-foreground text-xs"
              title={dateFmt.format(note.createdAt)}
            >
              {relativeTime(note.createdAt)}
            </span>
            {note.updatedAt.getTime() - note.createdAt.getTime() > 1000 ? (
              <span className="text-muted-foreground text-[10px] uppercase">
                · diedit
              </span>
            ) : null}
            {note.pinned && isTopLevel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                <Pin className="h-3 w-3" aria-hidden="true" />
                Disematkan
              </span>
            ) : null}
          </div>
          <div
            className="text-foreground mt-1 whitespace-pre-line break-words text-sm"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div className="mt-2 flex items-center gap-3">
            {isTopLevel ? (
              <NoteReplyToggle
                applicationId={applicationId}
                parentNoteId={note.id}
                tenantMembers={tenantMembers}
              />
            ) : null}
          </div>
        </div>
        <div className="shrink-0">
          <NoteActionsMenu
            noteId={note.id}
            body={note.body}
            pinned={note.pinned}
            canEdit={canEdit}
            canDelete={canDelete}
            canPin={isTopLevel && canPin}
            showPin={isTopLevel}
          />
        </div>
      </div>

      {note.replies.length > 0 ? (
        <ul
          className={
            depth === 0
              ? 'border-border mt-3 space-y-2 border-l-2 pl-4'
              : 'mt-2 space-y-2 pl-4'
          }
        >
          {note.replies.map((r) => (
            <NoteItem
              key={r.id}
              note={r}
              applicationId={applicationId}
              currentUserId={currentUserId}
              canPin={canPin}
              canModerate={canModerate}
              tenantMembers={tenantMembers}
              knownUsers={knownUsers}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

/**
 * Recruiter notes feed for an application detail page. Internal-only —
 * candidate UI never imports this. Renders compose box at the top, then
 * pinned notes (yellow tint), then chronological feed.
 */
export async function ApplicationNotesSection({
  applicationId,
  currentUserId,
  canPin,
  canModerate,
  tenantMembers,
}: ApplicationNotesSectionProps) {
  const notes = await getNotesForApplication(applicationId)

  // Build knownUsers lookup keyed by lowercase username for renderMentions.
  // Includes both tenantMembers AND note authors (so historical notes whose
  // author may have left the tenant still render with their name).
  const knownUsers: KnownUserLookup = {}
  for (const m of tenantMembers) {
    if (m.username) {
      knownUsers[m.username.toLowerCase()] = { id: m.userId, name: m.name }
    }
  }
  // Pull usernames from mentions present in the loaded notes.
  function walk(rows: NoteRow[]) {
    for (const n of rows) {
      for (const m of n.mentions) {
        const u = m.mentionedUser.username
        if (u && !knownUsers[u.toLowerCase()]) {
          knownUsers[u.toLowerCase()] = {
            id: m.mentionedUser.id,
            name: m.mentionedUser.name,
          }
        }
      }
      walk(n.replies)
    }
  }
  walk(notes)

  const pinnedNotes = notes.filter((n) => n.pinned)
  const otherNotes = notes.filter((n) => !n.pinned)

  return (
    <section
      aria-label="Catatan rekruter"
      className="border-border bg-card rounded-2xl border p-6 space-y-4"
    >
      <div className="flex items-start gap-2">
        <StickyNote className="text-muted-foreground mt-0.5 h-5 w-5" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg">Catatan rekruter</h2>
          <p className="text-muted-foreground text-xs">
            Catatan rekruter (internal — tidak terlihat oleh kandidat).
          </p>
        </div>
      </div>

      <NotesComposer
        applicationId={applicationId}
        tenantMembers={tenantMembers}
      />

      {pinnedNotes.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Disematkan ({pinnedNotes.length})
          </h3>
          <ul className="space-y-2">
            {pinnedNotes.map((n) => (
              <NoteItem
                key={n.id}
                note={n}
                applicationId={applicationId}
                currentUserId={currentUserId}
                canPin={canPin}
                canModerate={canModerate}
                tenantMembers={tenantMembers}
                knownUsers={knownUsers}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {otherNotes.length === 0 && pinnedNotes.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          Belum ada catatan
        </p>
      ) : null}

      {otherNotes.length > 0 ? (
        <ul className="space-y-2">
          {otherNotes.map((n) => (
            <NoteItem
              key={n.id}
              note={n}
              applicationId={applicationId}
              currentUserId={currentUserId}
              canPin={canPin}
              canModerate={canModerate}
              tenantMembers={tenantMembers}
              knownUsers={knownUsers}
            />
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default ApplicationNotesSection
