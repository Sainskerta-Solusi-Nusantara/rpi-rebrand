import Link from 'next/link'

type PressSortPillsProps = {
  options: { value: string; label: string; href: string; active: boolean }[]
}

export default function PressSortPills({ options }: PressSortPillsProps) {
  if (options.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Urutkan</span>
      {options.map((o) => (
        <Link
          key={o.value}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={o.href as any}
          aria-current={o.active ? 'true' : undefined}
          className={o.active
            ? 'border-[color:var(--ring)] bg-[color:var(--ring)] text-[color:var(--primary-foreground)] inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition'
            : 'border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] inline-flex items-center rounded-full border px-3 py-1 text-xs transition'
          }
        >
          {o.label}
        </Link>
      ))}
    </div>
  )
}
