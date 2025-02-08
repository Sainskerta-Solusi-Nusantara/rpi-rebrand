export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="bg-background flex min-h-screen w-full"
    >
      <div className="bg-muted hidden h-screen w-16 animate-pulse md:block" />
      <div className="flex-1 p-6 space-y-6">
        <div className="bg-muted h-12 w-full animate-pulse rounded-md" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-muted h-24 animate-pulse rounded-xl" />
          <div className="bg-muted h-24 animate-pulse rounded-xl" />
          <div className="bg-muted h-24 animate-pulse rounded-xl" />
          <div className="bg-muted h-24 animate-pulse rounded-xl" />
        </div>
        <div className="bg-muted h-72 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bg-muted h-48 animate-pulse rounded-xl" />
          <div className="bg-muted h-48 animate-pulse rounded-xl" />
        </div>
        <span className="sr-only">Memuat dasbor…</span>
      </div>
    </div>
  )
}
