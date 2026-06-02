import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server-dictionary'

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

function FilterGroup({ title, items, emptyLabel }: { title: string; items: SidebarGroup[]; emptyLabel: string }) {
  return (
    <div>
      <h2 className="text-muted-foreground mb-2 text-[11px] font-semibold uppercase tracking-wider">
        {title}
      </h2>
      <div className="space-y-1">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-xs">{emptyLabel}</p>
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

export default async function CoursesSidebar({
  levels,
  durations,
  tenants,
  instructors,
}: CoursesSidebarProps) {
  const t = await getServerT()
  const tc = t.formsMisc3.coursesSidebar

  return (
    <aside aria-label="Filter" className="space-y-8">
      <FilterGroup title={tc.filterLevel} items={levels} emptyLabel={tc.emptyData} />
      <FilterGroup title={tc.filterDuration} items={durations} emptyLabel={tc.emptyData} />
      <FilterGroup title={tc.filterPartner} items={tenants} emptyLabel={tc.emptyData} />
      <FilterGroup title={tc.filterInstructor} items={instructors} emptyLabel={tc.emptyData} />
    </aside>
  )
}
