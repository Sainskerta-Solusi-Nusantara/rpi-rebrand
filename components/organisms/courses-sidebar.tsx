import Link from 'next/link'

type SidebarGroup = {
  label: string
  count?: number
  href: string
  active: boolean
}

type CoursesSidebarProps = {
  levels: SidebarGroup[]
  durations: SidebarGroup[]
  tenants: SidebarGroup[]
  instructors: SidebarGroup[]
}

function ToggleRow({ label, count, href, active }: SidebarGroup) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={href as any}
      aria-current={active ? 'true' : undefined}
      className={
        active
          ? 'text-[color:var(--ring)] flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium'
          : 'text-foreground/80 hover:text-[color:var(--ring)] flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition'
      }
    >
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="text-muted-foreground ml-2 text-xs">{count}</span>}
    </Link>
  )
}

function FilterGroup({ title, items }: { title: string; items: SidebarGroup[] }) {
  return (
    <div>
      <h2 className="text-muted-foreground mb-2 text-[11px] font-semibold uppercase tracking-wider">
        {title}
      </h2>
      <div className="space-y-1">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-xs">Belum ada data.</p>
        ) : (
          items.map((item) => (
            <ToggleRow
              key={item.href}
              label={item.label}
              count={item.count}
              href={item.href}
              active={item.active}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default function CoursesSidebar({
  levels,
  durations,
  tenants,
  instructors,
}: CoursesSidebarProps) {
  return (
    <aside aria-label="Filter" className="space-y-8">
      <FilterGroup title="Tingkat" items={levels} />
      <FilterGroup title="Durasi" items={durations} />
      <FilterGroup title="Mitra" items={tenants} />
      <FilterGroup title="Instruktur" items={instructors} />
    </aside>
  )
}
