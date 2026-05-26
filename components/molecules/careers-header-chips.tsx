import Link from 'next/link'
import { X } from 'lucide-react'

type CareersHeaderChipsProps = {
  chips: { label: string; clearHref: string }[]
  clearAllHref: string
}

function FilterChip({ label, clearHref }: { label: string; clearHref: string }) {
  return (
    <span className="border-border bg-muted/40 text-foreground/85 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs">
      {label}
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={clearHref as any}
        aria-label={`Hapus filter ${label}`}
        className="text-muted-foreground hover:text-foreground -mr-0.5 inline-flex"
      >
        <X className="h-3 w-3" aria-hidden />
      </Link>
    </span>
  )
}

export default function CareersHeaderChips({
  chips,
  clearAllHref,
}: CareersHeaderChipsProps) {
  if (chips.length === 0) {
    return null
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <FilterChip
          key={chip.label}
          label={chip.label}
          clearHref={chip.clearHref}
        />
      ))}
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={clearAllHref as any}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
      >
        <X className="h-3 w-3" aria-hidden />
        Bersihkan semua
      </Link>
    </div>
  )
}
