'use client'

import * as React from 'react'
import { Reply } from 'lucide-react'
import { NotesComposer, type TenantMember } from './notes-composer'

export interface NoteReplyToggleProps {
  applicationId: string
  parentNoteId: string
  tenantMembers: TenantMember[]
}

/**
 * Renders a "Balas" button; when clicked, expands a compact NotesComposer
 * scoped to a parent note. Lives client-side so the parent section can stay
 * a Server Component.
 */
export function NoteReplyToggle({
  applicationId,
  parentNoteId,
  tenantMembers,
}: NoteReplyToggleProps) {
  const [open, setOpen] = React.useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
      >
        <Reply className="h-3.5 w-3.5" />
        Balas
      </button>
    )
  }

  return (
    <div className="mt-2">
      <NotesComposer
        applicationId={applicationId}
        parentNoteId={parentNoteId}
        tenantMembers={tenantMembers}
        compact
        placeholder="Tulis balasan..."
        submitLabel="Kirim balasan"
        onSuccess={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    </div>
  )
}

export default NoteReplyToggle
